// routes/comments.js
const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

/* -------------------- 共用工具 -------------------- */
async function isEnrolled(req, userId, courseId) {
  const [rows] = await req.db
    .promise()
    .query(`SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1`, [userId, courseId]);
  return !!rows.length;
}

async function getCourseIdByChapter(req, chapterId) {
  const [rows] = await req.db
    .promise()
    .query(`SELECT course_id FROM course_chapters WHERE id = ?`, [chapterId]);
  return rows[0]?.course_id ?? null;
}

// 可擴充為作者/管理員判定（目前：作者可改刪）
function canManageComment(user, comment) {
  return user?.id === comment.user_id;
}

/* ====================== 留言列表 ====================== */
/**
 * GET /api/comments/chapters/:chapterId
 * 取得章節留言（分頁；預設時間正序，便於閱讀）
 * query: page=1 size=20
 */
router.get('/chapters/:chapterId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const chapterId = Number(req.params.chapterId);
    if (!Number.isInteger(chapterId)) {
      return res.status(400).json({ error: 'invalid_chapter_id' });
    }

    const courseId = await getCourseIdByChapter(req, chapterId);
    if (!courseId) return res.status(404).json({ error: 'chapter_not_found' });

    const enrolled = await isEnrolled(req, userId, courseId);
    if (!enrolled) return res.status(403).json({ error: 'forbidden_not_enrolled' });

    const page = Math.max(1, Number(req.query.page) || 1);
    const size = Math.min(100, Math.max(1, Number(req.query.size) || 20));
    const offset = (page - 1) * size;

    const [[{ total }]] = await req.db
      .promise()
      .query(`SELECT COUNT(1) AS total FROM chapter_comments WHERE chapter_id = ?`, [chapterId]);

    const [rows] = await req.db
      .promise()
      .query(
        `SELECT id, chapter_id, user_id, body, created_at, updated_at
           FROM chapter_comments
          WHERE chapter_id = ?
          ORDER BY created_at ASC, id ASC
          LIMIT ? OFFSET ?`,
        [chapterId, size, offset]
      );

    return res.json({ chapterId, page, size, total, comments: rows });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/* ====================== 新增留言 ====================== */
/**
 * POST /api/comments/chapters/:chapterId
 * body: { body: string }
 */
router.post('/chapters/:chapterId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const chapterId = Number(req.params.chapterId);
    const { body } = req.body || {};

    if (!Number.isInteger(chapterId)) return res.status(400).json({ error: 'invalid_chapter_id' });
    if (!body || !body.trim()) return res.status(400).json({ error: 'body_required' });

    const courseId = await getCourseIdByChapter(req, chapterId);
    if (!courseId) return res.status(404).json({ error: 'chapter_not_found' });

    const enrolled = await isEnrolled(req, userId, courseId);
    if (!enrolled) return res.status(403).json({ error: 'forbidden_not_enrolled' });

    const [result] = await req.db
      .promise()
      .query(
        `INSERT INTO chapter_comments (chapter_id, user_id, body, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())`,
        [chapterId, userId, body.trim()]
      );

    return res.status(201).json({
      id: result.insertId,
      chapter_id: chapterId,
      user_id: userId,
      body: body.trim()
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/* ====================== 更新留言 ====================== */
/**
 * PATCH /api/comments/:commentId
 * body: { body: string }
 */
router.patch('/:commentId', authenticateToken, async (req, res) => {
  try {
    const commentId = Number(req.params.commentId);
    const { body } = req.body || {};
    if (!Number.isInteger(commentId)) return res.status(400).json({ error: 'invalid_comment_id' });
    if (!body || !body.trim()) return res.status(400).json({ error: 'body_required' });

    const [[comment]] = await req.db
      .promise()
      .query(
        `SELECT cc.*, c.course_id
           FROM chapter_comments cc
           JOIN course_chapters ch ON ch.id = cc.chapter_id
           JOIN courses c ON c.id = ch.course_id
          WHERE cc.id = ?`,
        [commentId]
      );

    if (!comment) return res.status(404).json({ error: 'comment_not_found' });
    if (!canManageComment(req.user, comment)) return res.status(403).json({ error: 'forbidden' });

    await req.db
      .promise()
      .query(`UPDATE chapter_comments SET body = ?, updated_at = NOW() WHERE id = ?`, [
        body.trim(),
        commentId
      ]);

    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/* ====================== 刪除留言 ====================== */
/**
 * DELETE /api/comments/:commentId
 */
router.delete('/:commentId', authenticateToken, async (req, res) => {
  try {
    const commentId = Number(req.params.commentId);
    if (!Number.isInteger(commentId)) return res.status(400).json({ error: 'invalid_comment_id' });

    const [[comment]] = await req.db
      .promise()
      .query(
        `SELECT cc.*, ch.course_id
           FROM chapter_comments cc
           JOIN course_chapters ch ON ch.id = cc.chapter_id
          WHERE cc.id = ?`,
        [commentId]
      );

    if (!comment) return res.status(404).json({ error: 'comment_not_found' });
    if (!canManageComment(req.user, comment)) return res.status(403).json({ error: 'forbidden' });

    await req.db.promise().query(`DELETE FROM chapter_comments WHERE id = ?`, [commentId]);
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = router;
