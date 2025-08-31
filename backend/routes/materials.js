// routes/materials.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const authenticateToken = require("../middleware/authMiddleware");
const router = express.Router();

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const PUBLIC_MATERIALS_DIR = path.join(process.cwd(), "public", "materials");

/* -------------------- 工具 -------------------- */
async function isEnrolled(req, userId, courseId) {
  const [rows] = await req.db
    .promise()
    .query(
      `SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1`,
      [userId, courseId]
    );
  return !!rows.length;
}

async function getCourseIdByChapter(req, chapterId) {
  const [rows] = await req.db
    .promise()
    .query(`SELECT course_id FROM course_chapters WHERE id = ?`, [chapterId]);
  return rows[0]?.course_id ?? null;
}

function toAbsoluteUrl(p) {
  if (!p) return p;
  if (/^https?:\/\//i.test(p) || /^data:/i.test(p)) return p;
  const clean = p.startsWith("/") ? p.slice(1) : p;
  return `${BASE_URL}/${clean}`;
}

// 如需限制成「教師/管理員」才能管理，改這裡（示範：所有登入者都可）
function canManage(user /*, courseId */) {
  return !!user; // 改成 user.role === 'admin' 等
}

/* -------------------- 查詢類 -------------------- */

/** 章節教材清單 */
router.get("/chapters/:chapterId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const chapterId = Number(req.params.chapterId);
    if (!Number.isInteger(chapterId)) {
      return res.status(400).json({ error: "invalid_chapter_id" });
    }

    const courseId = await getCourseIdByChapter(req, chapterId);
    if (!courseId) return res.status(404).json({ error: "chapter_not_found" });

    // 若要開放所有人查看，移除此段
    const enrolled = await isEnrolled(req, userId, courseId);
    if (!enrolled) return res.status(403).json({ error: "forbidden_not_enrolled" });

    const [rows] = await req.db
      .promise()
      .query(
        `SELECT id, chapter_id, title, type, url, position, created_at, updated_at
         FROM chapter_materials
         WHERE chapter_id = ?
         ORDER BY position ASC, id ASC`,
        [chapterId]
      );

    const materials = rows.map((m) => ({ ...m, url: toAbsoluteUrl(m.url) }));
    return res.json({ chapterId, courseId, materials });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "internal_error" });
  }
});

/** 課程所有章節教材（分組） */
router.get("/courses/:courseId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const courseId = Number(req.params.courseId);
    if (!Number.isInteger(courseId)) {
      return res.status(400).json({ error: "invalid_course_id" });
    }

    const enrolled = await isEnrolled(req, userId, courseId);
    if (!enrolled) return res.status(403).json({ error: "forbidden_not_enrolled" });

    const [chapters] = await req.db
      .promise()
      .query(
        `SELECT id, title, position
           FROM course_chapters
          WHERE course_id = ?
          ORDER BY position ASC, id ASC`,
        [courseId]
      );

    if (!chapters.length) return res.json({ courseId, chapters: [] });

    const ids = chapters.map((c) => c.id);
    const [materials] = await req.db
      .promise()
      .query(
        `SELECT id, chapter_id, title, type, url, position, created_at, updated_at
           FROM chapter_materials
          WHERE chapter_id IN (${ids.map(() => "?").join(",")})
          ORDER BY chapter_id ASC, position ASC, id ASC`,
        ids
      );

    const byChapter = new Map(chapters.map((c) => [c.id, { ...c, materials: [] }]));
    for (const m of materials) {
      const item = { ...m, url: toAbsoluteUrl(m.url) };
      const group = byChapter.get(m.chapter_id);
      if (group) group.materials.push(item);
    }
    return res.json({ courseId, chapters: Array.from(byChapter.values()) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "internal_error" });
  }
});

/** 受保護下載/導向 */
router.get("/:materialId/download", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const materialId = Number(req.params.materialId);
    if (!Number.isInteger(materialId)) {
      return res.status(400).json({ error: "invalid_material_id" });
    }

    const [[material]] = await req.db
      .promise()
      .query(
        `SELECT m.id, m.chapter_id, m.title, m.type, m.url, c.course_id
           FROM chapter_materials m
           JOIN course_chapters c ON c.id = m.chapter_id
          WHERE m.id = ?`,
        [materialId]
      );

    if (!material) return res.status(404).json({ error: "material_not_found" });

    const enrolled = await isEnrolled(req, userId, material.course_id);
    if (!enrolled) return res.status(403).json({ error: "forbidden_not_enrolled" });

    if (material.type === "link") {
      return res.redirect(toAbsoluteUrl(material.url));
    }

    const url = material.url || "";
    if (/^https?:\/\//i.test(url)) {
      return res.redirect(url);
    }

    if (!url.startsWith("/materials/")) {
      return res.status(400).json({ error: "invalid_material_url" });
    }

    const rel = url.replace("/materials/", "");
    const absPath = path.join(PUBLIC_MATERIALS_DIR, rel);
    if (!absPath.startsWith(PUBLIC_MATERIALS_DIR)) {
      return res.status(400).json({ error: "invalid_path" });
    }
    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ error: "file_not_found" });
    }
    return res.download(absPath, path.basename(absPath));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "internal_error" });
  }
});

/* -------------------- 管理類（新增 / 刪除 / 排序） -------------------- */

/** 新增教材（章節底下建立一筆） */
router.post("/chapters/:chapterId", authenticateToken, async (req, res) => {
  try {
    if (!canManage(req.user)) return res.status(403).json({ error: "forbidden" });

    const chapterId = Number(req.params.chapterId);
    if (!Number.isInteger(chapterId)) {
      return res.status(400).json({ error: "invalid_chapter_id" });
    }

    const { title, type = "pdf", url, position } = req.body || {};
    if (!title || !url) {
      return res.status(400).json({ error: "title_and_url_required" });
    }

    // 取得 courseId 以便做權限（如需）
    const courseId = await getCourseIdByChapter(req, chapterId);
    if (!courseId) return res.status(404).json({ error: "chapter_not_found" });

    // 若未指定 position，預設接在最後
    let pos = Number.isInteger(position) ? Number(position) : null;
    if (pos === null) {
      const [[row]] = await req.db
        .promise()
        .query(
          `SELECT COALESCE(MAX(position), 0) AS max_pos FROM chapter_materials WHERE chapter_id = ?`,
          [chapterId]
        );
      pos = (row?.max_pos || 0) + 1;
    }

    const [result] = await req.db
      .promise()
      .query(
        `INSERT INTO chapter_materials (chapter_id, title, type, url, position, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [chapterId, title.trim(), type, url, pos]
      );

    return res.status(201).json({
      id: result.insertId,
      chapter_id: chapterId,
      title,
      type,
      url: toAbsoluteUrl(url),
      position: pos,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "internal_error" });
  }
});

/** 刪除教材（單筆） */
router.delete("/:materialId", authenticateToken, async (req, res) => {
  try {
    if (!canManage(req.user)) return res.status(403).json({ error: "forbidden" });

    const materialId = Number(req.params.materialId);
    if (!Number.isInteger(materialId)) {
      return res.status(400).json({ error: "invalid_material_id" });
    }

    // 先查出章節與當前位置，並取得 courseId 做權限（如需）
    const [[m]] = await req.db
      .promise()
      .query(
        `SELECT m.id, m.chapter_id, m.position, c.course_id
           FROM chapter_materials m
           JOIN course_chapters c ON c.id = m.chapter_id
          WHERE m.id = ?`,
        [materialId]
      );
    if (!m) return res.status(404).json({ error: "material_not_found" });

    const conn = req.db.promise();
    await conn.query("START TRANSACTION");

    try {
      await conn.query(`DELETE FROM chapter_materials WHERE id = ?`, [materialId]);
      // 把後面位置往前縮
      await conn.query(
        `UPDATE chapter_materials 
            SET position = position - 1 
          WHERE chapter_id = ? AND position > ?`,
        [m.chapter_id, m.position]
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

/** 整章節重排（一次提交 orderedIds） */
router.post("/chapters/:chapterId/reorder", authenticateToken, async (req, res) => {
  try {
    if (!canManage(req.user)) return res.status(403).json({ error: "forbidden" });

    const chapterId = Number(req.params.chapterId);
    if (!Number.isInteger(chapterId)) {
      return res.status(400).json({ error: "invalid_chapter_id" });
    }

    const { orderedIds } = req.body || {};
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ error: "orderedIds_required" });
    }

    // 先檢查 orderedIds 是否都隸屬於該章節
    const [rows] = await req.db
      .promise()
      .query(
        `SELECT id FROM chapter_materials WHERE chapter_id = ?`,
        [chapterId]
      );
    const existingIds = new Set(rows.map(r => r.id));
    for (const id of orderedIds) {
      if (!existingIds.has(Number(id))) {
        return res.status(400).json({ error: `material_not_in_chapter:${id}` });
      }
    }

    const conn = req.db.promise();
    await conn.query("START TRANSACTION");
    try {
      // 依序更新 position = 1..n
      for (let i = 0; i < orderedIds.length; i++) {
        await conn.query(
          `UPDATE chapter_materials SET position = ?, updated_at = NOW() WHERE id = ?`,
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

/** 單筆移動位置（把 id 移到 position，其餘自動讓位） */
router.patch("/:materialId/position", authenticateToken, async (req, res) => {
  try {
    if (!canManage(req.user)) return res.status(403).json({ error: "forbidden" });

    const materialId = Number(req.params.materialId);
    const targetPos = Number(req.body?.position);
    if (!Number.isInteger(materialId) || !Number.isInteger(targetPos) || targetPos < 1) {
      return res.status(400).json({ error: "invalid_params" });
    }

    const [[m]] = await req.db
      .promise()
      .query(
        `SELECT id, chapter_id, position FROM chapter_materials WHERE id = ?`,
        [materialId]
      );
    if (!m) return res.status(404).json({ error: "material_not_found" });

    const [[row]] = await req.db
      .promise()
      .query(
        `SELECT COUNT(1) AS cnt FROM chapter_materials WHERE chapter_id = ?`,
        [m.chapter_id]
      );
    const maxPos = row?.cnt || 0;
    const newPos = Math.min(targetPos, maxPos); // 超過尾端就放最後

    if (newPos === m.position) {
      return res.json({ success: true, position: newPos });
    }

    const conn = req.db.promise();
    await conn.query("START TRANSACTION");
    try {
      if (newPos < m.position) {
        // 往前移：newPos..oldPos-1 全 +1
        await conn.query(
          `UPDATE chapter_materials
              SET position = position + 1
            WHERE chapter_id = ?
              AND position >= ?
              AND position < ?`,
          [m.chapter_id, newPos, m.position]
        );
      } else {
        // 往後移：oldPos+1..newPos 全 -1
        await conn.query(
          `UPDATE chapter_materials
              SET position = position - 1
            WHERE chapter_id = ?
              AND position > ?
              AND position <= ?`,
          [m.chapter_id, m.position, newPos]
        );
      }

      await conn.query(
        `UPDATE chapter_materials SET position = ?, updated_at = NOW() WHERE id = ?`,
        [newPos, materialId]
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
