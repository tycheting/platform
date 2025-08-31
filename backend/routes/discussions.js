// routes/discussions.js
const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

/* -------------------- 共用工具 -------------------- */
async function isEnrolled(req, userId, courseId) {
  const [rows] = await req.db.promise().query(
    `SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1`,
    [userId, courseId]
  );
  return !!rows.length;
}

async function getCourseIdByChapter(req, chapterId) {
  const [rows] = await req.db.promise().query(
    `SELECT course_id FROM course_chapters WHERE id = ?`,
    [chapterId]
  );
  return rows[0]?.course_id ?? null;
}

// 可自由擴充（示範：作者可管理；若有 users.role 可改 admin 判斷）
function canManageThread(user, thread) { return user?.id === thread.user_id; }
function canManagePost(user, post) { return user?.id === post.user_id; }

/* ========== 討論串：清單 / 新增 / 更新 / 刪除 / 置頂 ========== */

/**
 * GET /api/discussions/chapters/:chapterId
 * 章節討論串清單（支援分頁、關鍵字搜尋、置頂、統計）
 * query:
 *   - page=1 size=20
 *   - q=keyword     （同時在討論串 title/body 與貼文 body 搜尋）
 */
router.get('/chapters/:chapterId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const chapterId = Number(req.params.chapterId);
    if (!Number.isInteger(chapterId)) return res.status(400).json({ error: 'invalid_chapter_id' });

    const courseId = await getCourseIdByChapter(req, chapterId);
    if (!courseId) return res.status(404).json({ error: 'chapter_not_found' });

    const enrolled = await isEnrolled(req, userId, courseId);
    if (!enrolled) return res.status(403).json({ error: 'forbidden_not_enrolled' });

    const page = Math.max(1, Number(req.query.page) || 1);
    const size = Math.min(50, Math.max(1, Number(req.query.size) || 20));
    const offset = (page - 1) * size;

    const q = (req.query.q || '').trim();
    const hasQ = q.length > 0;
    const kw = `%${q}%`;

    const whereParts = ['d.chapter_id = ?'];
    const whereParams = [chapterId];

    if (hasQ) {
      // 標題/內文 或 任一貼文內容 命中
      whereParts.push(`(
        d.title LIKE ? OR d.body LIKE ? OR EXISTS (
          SELECT 1 FROM discussion_posts px
           WHERE px.discussion_id = d.id
             AND px.body LIKE ?
        )
      )`);
      whereParams.push(kw, kw, kw);
    }
    const whereSQL = whereParts.join(' AND ');

    // 總筆數（注意 DISTINCT）
    const [[{ total }]] = await req.db.promise().query(
      `SELECT COUNT(DISTINCT d.id) AS total
         FROM chapter_discussions d
        WHERE ${whereSQL}`,
      whereParams
    );

    // 直接使用資料表已維護的統計欄位
    const [rows] = await req.db.promise().query(
      `SELECT
         d.id, d.chapter_id, d.user_id, d.title, d.body, d.pinned,
         d.posts_count, d.last_reply_at, d.created_at, d.updated_at
       FROM chapter_discussions d
       WHERE ${whereSQL}
       ORDER BY
         d.pinned DESC,
         d.last_reply_at DESC,
         d.created_at DESC,
         d.id DESC
       LIMIT ? OFFSET ?`,
      [...whereParams, size, offset]
    );

    res.json({
      chapterId,
      page, size, total,
      threads: rows.map(r => ({
        id: r.id,
        chapter_id: r.chapter_id,
        user_id: r.user_id,
        title: r.title,
        body: r.body,
        pinned: !!r.pinned,
        posts_count: Number(r.posts_count) || 0,
        last_reply_at: r.last_reply_at,
        created_at: r.created_at,
        updated_at: r.updated_at
      }))
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * POST /api/discussions/chapters/:chapterId
 * 建立討論串（初始化 posts_count=0, last_reply_at=NOW()）
 * body: { title, body }
 */
router.post('/chapters/:chapterId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const chapterId = Number(req.params.chapterId);
    const { title, body } = req.body || {};
    if (!Number.isInteger(chapterId)) return res.status(400).json({ error: 'invalid_chapter_id' });
    if (!title || !title.trim()) return res.status(400).json({ error: 'title_required' });

    const courseId = await getCourseIdByChapter(req, chapterId);
    if (!courseId) return res.status(404).json({ error: 'chapter_not_found' });

    const enrolled = await isEnrolled(req, userId, courseId);
    if (!enrolled) return res.status(403).json({ error: 'forbidden_not_enrolled' });

    const [result] = await req.db.promise().query(
      `INSERT INTO chapter_discussions
         (chapter_id, user_id, title, body, pinned, posts_count, last_reply_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, 0, NOW(), NOW(), NOW())`,
      [chapterId, userId, title.trim(), body ?? null]
    );

    res.status(201).json({
      id: result.insertId,
      chapter_id: chapterId,
      user_id: userId,
      title: title.trim(),
      body: body ?? null,
      pinned: 0,
      posts_count: 0,
      last_reply_at: new Date().toISOString()
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * PATCH /api/discussions/:discussionId
 * 更新討論串（作者或管理員）
 * body: { title?, body?, pinned? }
 */
router.patch('/:discussionId', authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.discussionId);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

    const [[thread]] = await req.db.promise().query(
      `SELECT d.*, c.course_id
         FROM chapter_discussions d
         JOIN course_chapters c ON c.id = d.chapter_id
        WHERE d.id = ?`,
      [id]
    );
    if (!thread) return res.status(404).json({ error: 'not_found' });
    if (!canManageThread(req.user, thread)) return res.status(403).json({ error: 'forbidden' });

    const fields = [];
    const values = [];
    const { title, body, pinned } = req.body || {};
    if (title !== undefined) { fields.push('title = ?'); values.push(title || ''); }
    if (body !== undefined)  { fields.push('body = ?');  values.push(body ?? null); }
    if (pinned !== undefined) { fields.push('pinned = ?'); values.push(!!pinned ? 1 : 0); }

    if (!fields.length) return res.json({ success: true });

    fields.push('updated_at = NOW()');
    values.push(id);
    await req.db.promise().query(
      `UPDATE chapter_discussions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * DELETE /api/discussions/:discussionId
 * 刪除討論串（作者或管理員）+ 其貼文
 */
router.delete('/:discussionId', authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.discussionId);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

    const [[thread]] = await req.db.promise().query(
      `SELECT d.*, c.course_id
         FROM chapter_discussions d
         JOIN course_chapters c ON c.id = d.chapter_id
        WHERE d.id = ?`,
      [id]
    );
    if (!thread) return res.status(404).json({ error: 'not_found' });
    if (!canManageThread(req.user, thread)) return res.status(403).json({ error: 'forbidden' });

    const conn = req.db.promise();
    await conn.query('START TRANSACTION');
    try {
      await conn.query(`DELETE FROM discussion_posts WHERE discussion_id = ?`, [id]);
      await conn.query(`DELETE FROM chapter_discussions WHERE id = ?`, [id]);
      await conn.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await conn.query('ROLLBACK');
      throw err;
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * PATCH /api/discussions/:discussionId/pin
 * 置頂/取消置頂
 * body: { pinned: true|false }
 */
router.patch('/:discussionId/pin', authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.discussionId);
    const pinned = !!req.body?.pinned;
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

    const [[thread]] = await req.db.promise().query(
      `SELECT d.*, c.course_id
         FROM chapter_discussions d
         JOIN course_chapters c ON c.id = d.chapter_id
        WHERE d.id = ?`,
      [id]
    );
    if (!thread) return res.status(404).json({ error: 'not_found' });
    if (!canManageThread(req.user, thread)) return res.status(403).json({ error: 'forbidden' });

    await req.db.promise().query(
      `UPDATE chapter_discussions SET pinned = ?, updated_at = NOW() WHERE id = ?`,
      [pinned ? 1 : 0, id]
    );
    res.json({ success: true, pinned });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal_error' });
  }
});

/* ========== 貼文：清單 / 新增 / 更新 / 刪除 ========== */

/**
 * GET /api/discussions/:discussionId/posts
 * 讀取貼文列表（分頁）
 * query: page=1 size=20
 */
router.get('/:discussionId/posts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const discussionId = Number(req.params.discussionId);
    if (!Number.isInteger(discussionId)) return res.status(400).json({ error: 'invalid_discussion_id' });

    const [[thread]] = await req.db.promise().query(
      `SELECT d.chapter_id, c.course_id
         FROM chapter_discussions d
         JOIN course_chapters c ON c.id = d.chapter_id
        WHERE d.id = ?`,
      [discussionId]
    );
    if (!thread) return res.status(404).json({ error: 'discussion_not_found' });

    const enrolled = await isEnrolled(req, userId, thread.course_id);
    if (!enrolled) return res.status(403).json({ error: 'forbidden_not_enrolled' });

    const page = Math.max(1, Number(req.query.page) || 1);
    const size = Math.min(100, Math.max(1, Number(req.query.size) || 20));
    const offset = (page - 1) * size;

    const [[{ total }]] = await req.db.promise().query(
      `SELECT COUNT(1) AS total FROM discussion_posts WHERE discussion_id = ?`,
      [discussionId]
    );

    const [rows] = await req.db.promise().query(
      `SELECT id, discussion_id, user_id, body, parent_id, created_at, updated_at
         FROM discussion_posts
        WHERE discussion_id = ?
        ORDER BY created_at ASC, id ASC
        LIMIT ? OFFSET ?`,
      [discussionId, size, offset]
    );

    res.json({ discussionId, page, size, total, posts: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * POST /api/discussions/:discussionId/posts
 * 新增貼文（或回覆）→ 增量更新 posts_count / last_reply_at
 * body: { body, parent_id? }
 */
router.post('/:discussionId/posts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const discussionId = Number(req.params.discussionId);
    const { body, parent_id } = req.body || {};
    if (!Number.isInteger(discussionId)) return res.status(400).json({ error: 'invalid_discussion_id' });
    if (!body || !body.trim()) return res.status(400).json({ error: 'body_required' });

    const [[thread]] = await req.db.promise().query(
      `SELECT d.id, d.chapter_id, c.course_id
         FROM chapter_discussions d
         JOIN course_chapters c ON c.id = d.chapter_id
        WHERE d.id = ?`,
      [discussionId]
    );
    if (!thread) return res.status(404).json({ error: 'discussion_not_found' });

    const enrolled = await isEnrolled(req, userId, thread.course_id);
    if (!enrolled) return res.status(403).json({ error: 'forbidden_not_enrolled' });

    if (parent_id != null) {
      const [[parent]] = await req.db.promise().query(
        `SELECT id FROM discussion_posts WHERE id = ? AND discussion_id = ?`,
        [Number(parent_id), discussionId]
      );
      if (!parent) return res.status(400).json({ error: 'invalid_parent_id' });
    }

    const conn = req.db.promise();
    await conn.query('START TRANSACTION');
    try {
      const [result] = await conn.query(
        `INSERT INTO discussion_posts (discussion_id, user_id, body, parent_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [discussionId, userId, body.trim(), parent_id ?? null]
      );

      // ✅ 增量維護統計
      await conn.query(
        `UPDATE chapter_discussions 
            SET posts_count = posts_count + 1,
                last_reply_at = NOW(),
                updated_at = NOW()
          WHERE id = ?`,
        [discussionId]
      );

      await conn.query('COMMIT');
      return res.status(201).json({
        id: result.insertId,
        discussion_id: discussionId,
        user_id: userId,
        body: body.trim(),
        parent_id: parent_id ?? null
      });
    } catch (err) {
      await conn.query('ROLLBACK');
      throw err;
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * PATCH /api/discussions/posts/:postId
 * 更新貼文（作者或管理員）
 * body: { body }
 */
router.patch('/posts/:postId', authenticateToken, async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const { body } = req.body || {};
    if (!Number.isInteger(postId)) return res.status(400).json({ error: 'invalid_post_id' });
    if (!body || !body.trim()) return res.status(400).json({ error: 'body_required' });

    const [[post]] = await req.db.promise().query(
      `SELECT p.*, d.chapter_id, c.course_id
         FROM discussion_posts p
         JOIN chapter_discussions d ON d.id = p.discussion_id
         JOIN course_chapters c ON c.id = d.chapter_id
        WHERE p.id = ?`,
      [postId]
    );
    if (!post) return res.status(404).json({ error: 'post_not_found' });
    if (!canManagePost(req.user, post)) return res.status(403).json({ error: 'forbidden' });

    await req.db.promise().query(
      `UPDATE discussion_posts SET body = ?, updated_at = NOW() WHERE id = ?`,
      [body.trim(), postId]
    );
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * DELETE /api/discussions/posts/:postId
 * 刪除貼文（作者或管理員），並刪除其直接子回覆 → 重算統計
 */
router.delete('/posts/:postId', authenticateToken, async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    if (!Number.isInteger(postId)) return res.status(400).json({ error: 'invalid_post_id' });

    const [[post]] = await req.db.promise().query(
      `SELECT p.*, d.id AS discussion_id
         FROM discussion_posts p
         JOIN chapter_discussions d ON d.id = p.discussion_id
        WHERE p.id = ?`,
      [postId]
    );
    if (!post) return res.status(404).json({ error: 'post_not_found' });
    if (!canManagePost(req.user, post)) return res.status(403).json({ error: 'forbidden' });

    const conn = req.db.promise();
    await conn.query('START TRANSACTION');
    try {
      // 刪子回覆 + 自己
      await conn.query(`DELETE FROM discussion_posts WHERE parent_id = ?`, [postId]);
      await conn.query(`DELETE FROM discussion_posts WHERE id = ?`, [postId]);

      // ✅ 重算統計（較保守，確保正確）
      await conn.query(
        `UPDATE chapter_discussions d
           LEFT JOIN (
             SELECT discussion_id, COUNT(*) AS cnt, MAX(created_at) AS last_at
               FROM discussion_posts
              WHERE discussion_id = ?
           ) p ON p.discussion_id = d.id
           SET d.posts_count   = COALESCE(p.cnt, 0),
               d.last_reply_at = COALESCE(p.last_at, d.created_at),
               d.updated_at    = NOW()
         WHERE d.id = ?`,
        [post.discussion_id, post.discussion_id]
      );

      await conn.query('COMMIT');
      return res.json({ success: true });
    } catch (err) {
      await conn.query('ROLLBACK');
      throw err;
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = router;
