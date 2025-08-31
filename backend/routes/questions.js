// routes/questions.js
const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const router = express.Router();

/* -------------------- 共用小工具 -------------------- */
async function isEnrolled(req, userId, courseId) {
  const [rows] = await req.db
    .promise()
    .query(`SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1`, [userId, courseId]);
  return !!rows.length;
}

async function getCourseIdByChapter(req, chapterId) {
  const [rows] = await req.db.promise().query(
    `SELECT course_id FROM course_chapters WHERE id = ?`, [chapterId]
  );
  return rows[0]?.course_id ?? null;
}

// 嚴格等值（陣列/字串/布林）比較
function equalAnswer(expected, got, type) {
  try {
    if (type === 'multiple') {
      // 比較集合
      const a = Array.isArray(expected) ? expected.map(String) : [];
      const b = Array.isArray(got) ? got.map(String) : [];
      if (a.length !== b.length) return false;
      a.sort(); b.sort();
      return a.every((v, i) => v === b[i]);
    }
    if (type === 'single') {
      return String(expected) === String(got);
    }
    if (type === 'true_false') {
      const toBool = (v) => (typeof v === 'boolean') ? v : String(v).toLowerCase() === 'true';
      return toBool(expected) === toBool(got);
    }
    if (type === 'short_answer') {
      // 簡答：做基本正規化（去空白、小寫）
      const norm = (v) => String(v ?? '').trim().toLowerCase();
      if (Array.isArray(expected)) {
        const eg = expected.map(norm);
        return eg.includes(norm(got));
      }
      return norm(expected) === norm(got);
    }
    return false;
  } catch {
    return false;
  }
}

function parseJSONMaybe(v, fallback = null) {
  if (v == null) return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return fallback; }
}

/* -------------------- 讀取題目 -------------------- */
/**
 * GET /api/questions/chapters/:chapterId
 * 需要登入且必須已選修該課程
 */
router.get("/chapters/:chapterId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const chapterId = Number(req.params.chapterId);
    if (!Number.isInteger(chapterId)) {
      return res.status(400).json({ error: "invalid_chapter_id" });
    }

    const courseId = await getCourseIdByChapter(req, chapterId);
    if (!courseId) return res.status(404).json({ error: "chapter_not_found" });

    const enrolled = await isEnrolled(req, userId, courseId);
    if (!enrolled) return res.status(403).json({ error: "forbidden_not_enrolled" });

    const [rows] = await req.db.promise().query(
      `SELECT id, chapter_id, type, question, options, answer, explanation, score, position, created_at, updated_at
         FROM chapter_questions
        WHERE chapter_id = ?
        ORDER BY position ASC, id ASC`,
      [chapterId]
    );

    // 將 options/answer 轉回 JSON 給前端
    const questions = rows.map(q => ({
      ...q,
      options: parseJSONMaybe(q.options),
      answer: parseJSONMaybe(q.answer), // 若不想把正解回傳給前端，這裡可以刪掉或以環境變數控制
    }));

    return res.json({ chapterId, courseId, questions });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "internal_error" });
  }
});

/* -------------------- 作答檢查 -------------------- */
/**
 * POST /api/questions/:questionId/check
 * body: { userAnswer: string | string[] | boolean }
 * 回傳是否正確與解析
 */
router.post("/:questionId/check", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const qid = Number(req.params.questionId);
    if (!Number.isInteger(qid)) return res.status(400).json({ error: "invalid_question_id" });

    const [[q]] = await req.db.promise().query(
      `SELECT q.id, q.chapter_id, q.type, q.answer, q.explanation, c.course_id
         FROM chapter_questions q
         JOIN course_chapters c ON c.id = q.chapter_id
        WHERE q.id = ?`, [qid]
    );
    if (!q) return res.status(404).json({ error: "question_not_found" });

    const enrolled = await isEnrolled(req, userId, q.course_id);
    if (!enrolled) return res.status(403).json({ error: "forbidden_not_enrolled" });

    const expected = parseJSONMaybe(q.answer);
    const correct = equalAnswer(expected, req.body?.userAnswer, q.type);

    return res.json({
      questionId: qid,
      correct,
      explanation: q.explanation ?? null,
      // 想隱藏正解就移除此行
      expected,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "internal_error" });
  }
});

/* -------------------- 管理（新增 / 更新 / 刪除 / 排序 / 移動） -------------------- */
// 權限檢查：先放寬為任一登入者；實務上請改為教師/管理員判斷
function canManage(user /*, courseId */) { return !!user; }

/** 新增題目到章節 */
router.post("/chapters/:chapterId", authenticateToken, async (req, res) => {
  try {
    if (!canManage(req.user)) return res.status(403).json({ error: "forbidden" });
    const chapterId = Number(req.params.chapterId);
    if (!Number.isInteger(chapterId)) return res.status(400).json({ error: "invalid_chapter_id" });

    const courseId = await getCourseIdByChapter(req, chapterId);
    if (!courseId) return res.status(404).json({ error: "chapter_not_found" });

    const {
      type = 'single',
      question,
      options = null,   // 物件/陣列，會 JSON.stringify
      answer = null,    // 同上
      explanation = null,
      score = 1,
      position = null,
    } = req.body || {};

    if (!question) return res.status(400).json({ error: "question_required" });
    if (!['single','multiple','true_false','short_answer'].includes(type)) {
      return res.status(400).json({ error: "invalid_type" });
    }

    // 決定 position：未指定就接在最後
    let pos = Number.isInteger(position) ? position : null;
    if (pos === null) {
      const [[row]] = await req.db.promise().query(
        `SELECT COALESCE(MAX(position), 0) AS max_pos FROM chapter_questions WHERE chapter_id = ?`,
        [chapterId]
      );
      pos = (row?.max_pos || 0) + 1;
    }

    const [result] = await req.db.promise().query(
      `INSERT INTO chapter_questions
         (chapter_id, type, question, options, answer, explanation, score, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        chapterId,
        type,
        question,
        options != null ? JSON.stringify(options) : null,
        answer != null ? JSON.stringify(answer) : null,
        explanation,
        Number(score) || 1,
        pos
      ]
    );

    return res.status(201).json({
      id: result.insertId,
      chapter_id: chapterId,
      type, question,
      options, answer,
      explanation, score: Number(score) || 1,
      position: pos
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "internal_error" });
  }
});

/** 更新題目（可部分欄位） */
router.patch("/:questionId", authenticateToken, async (req, res) => {
  try {
    if (!canManage(req.user)) return res.status(403).json({ error: "forbidden" });
    const qid = Number(req.params.questionId);
    if (!Number.isInteger(qid)) return res.status(400).json({ error: "invalid_question_id" });

    const [[exists]] = await req.db.promise().query(
      `SELECT q.id, q.chapter_id, c.course_id
         FROM chapter_questions q
         JOIN course_chapters c ON c.id = q.chapter_id
        WHERE q.id = ?`, [qid]
    );
    if (!exists) return res.status(404).json({ error: "question_not_found" });

    const fields = [];
    const values = [];

    const { type, question, options, answer, explanation, score } = req.body || {};
    if (type) {
      if (!['single','multiple','true_false','short_answer'].includes(type)) {
        return res.status(400).json({ error: "invalid_type" });
      }
      fields.push("type = ?"); values.push(type);
    }
    if (question != null) { fields.push("question = ?"); values.push(question); }
    if (options !== undefined) { fields.push("options = ?"); values.push(options != null ? JSON.stringify(options) : null); }
    if (answer !== undefined) { fields.push("answer = ?"); values.push(answer != null ? JSON.stringify(answer) : null); }
    if (explanation !== undefined) { fields.push("explanation = ?"); values.push(explanation); }
    if (score !== undefined) { fields.push("score = ?"); values.push(Number(score) || 1); }

    if (!fields.length) return res.json({ success: true });

    fields.push("updated_at = NOW()");
    const sql = `UPDATE chapter_questions SET ${fields.join(", ")} WHERE id = ?`;
    values.push(qid);

    await req.db.promise().query(sql, values);
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "internal_error" });
  }
});

/** 刪除題目（並重排 position） */
router.delete("/:questionId", authenticateToken, async (req, res) => {
  try {
    if (!canManage(req.user)) return res.status(403).json({ error: "forbidden" });
    const qid = Number(req.params.questionId);
    if (!Number.isInteger(qid)) return res.status(400).json({ error: "invalid_question_id" });

    const [[q]] = await req.db.promise().query(
      `SELECT id, chapter_id, position FROM chapter_questions WHERE id = ?`, [qid]
    );
    if (!q) return res.status(404).json({ error: "question_not_found" });

    const conn = req.db.promise();
    await conn.query("START TRANSACTION");
    try {
      await conn.query(`DELETE FROM chapter_questions WHERE id = ?`, [qid]);
      await conn.query(
        `UPDATE chapter_questions
            SET position = position - 1
          WHERE chapter_id = ? AND position > ?`,
        [q.chapter_id, q.position]
      );
      await conn.query("COMMIT");
      return res.json({ success: true });
    } catch (e) {
      await conn.query("ROLLBACK");
      throw e;
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "internal_error" });
  }
});

/** 整章節重排 */
router.post("/chapters/:chapterId/reorder", authenticateToken, async (req, res) => {
  try {
    if (!canManage(req.user)) return res.status(403).json({ error: "forbidden" });
    const chapterId = Number(req.params.chapterId);
    if (!Number.isInteger(chapterId)) return res.status(400).json({ error: "invalid_chapter_id" });

    const { orderedIds } = req.body || {};
    if (!Array.isArray(orderedIds) || !orderedIds.length) {
      return res.status(400).json({ error: "orderedIds_required" });
    }

    const [rows] = await req.db.promise().query(
      `SELECT id FROM chapter_questions WHERE chapter_id = ?`, [chapterId]
    );
    const set = new Set(rows.map(r => r.id));
    for (const id of orderedIds) {
      if (!set.has(Number(id))) {
        return res.status(400).json({ error: `question_not_in_chapter:${id}` });
      }
    }

    const conn = req.db.promise();
    await conn.query("START TRANSACTION");
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        await conn.query(
          `UPDATE chapter_questions SET position = ?, updated_at = NOW() WHERE id = ?`,
          [i + 1, orderedIds[i]]
        );
      }
      await conn.query("COMMIT");
      return res.json({ success: true });
    } catch (e) {
      await conn.query("ROLLBACK");
      throw e;
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "internal_error" });
  }
});

/** 單筆移動位置 */
router.patch("/:questionId/position", authenticateToken, async (req, res) => {
  try {
    if (!canManage(req.user)) return res.status(403).json({ error: "forbidden" });

    const qid = Number(req.params.questionId);
    const targetPos = Number(req.body?.position);
    if (!Number.isInteger(qid) || !Number.isInteger(targetPos) || targetPos < 1) {
      return res.status(400).json({ error: "invalid_params" });
    }

    const [[q]] = await req.db.promise().query(
      `SELECT id, chapter_id, position FROM chapter_questions WHERE id = ?`, [qid]
    );
    if (!q) return res.status(404).json({ error: "question_not_found" });

    const [[row]] = await req.db.promise().query(
      `SELECT COUNT(1) AS cnt FROM chapter_questions WHERE chapter_id = ?`, [q.chapter_id]
    );
    const maxPos = row?.cnt || 0;
    const newPos = Math.min(targetPos, maxPos || 1);

    if (newPos === q.position) return res.json({ success: true, position: newPos });

    const conn = req.db.promise();
    await conn.query("START TRANSACTION");
    try {
      if (newPos < q.position) {
        await conn.query(
          `UPDATE chapter_questions
              SET position = position + 1
            WHERE chapter_id = ?
              AND position >= ?
              AND position < ?`,
          [q.chapter_id, newPos, q.position]
        );
      } else {
        await conn.query(
          `UPDATE chapter_questions
              SET position = position - 1
            WHERE chapter_id = ?
              AND position > ?
              AND position <= ?`,
          [q.chapter_id, q.position, newPos]
        );
      }

      await conn.query(
        `UPDATE chapter_questions SET position = ?, updated_at = NOW() WHERE id = ?`,
        [newPos, qid]
      );

      await conn.query("COMMIT");
      return res.json({ success: true, position: newPos });
    } catch (e) {
      await conn.query("ROLLBACK");
      throw e;
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "internal_error" });
  }
});

module.exports = router;
