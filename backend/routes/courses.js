const express = require("express");
const router = express.Router();

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

/** 小工具：把相對路徑補成絕對網址 */
function toAbsoluteUrl(p) {
  if (!p) return p;
  if (/^https?:\/\//i.test(p) || /^data:/i.test(p)) return p;
  const clean = p.startsWith("/") ? p.slice(1) : p;
  return `${BASE_URL}/${clean}`;
}

/** 以「任何型別的ID」取課程：數字 id 或 外部 key（course_id / course_key） */
async function findCourseByAnyId(db, raw) {
  // 1) 純數字 → 內部 id
  if (/^\d+$/.test(raw)) {
    const [rows] = await db.promise().query("SELECT * FROM courses WHERE id = ?", [Number(raw)]);
    if (rows[0]) return rows[0];
  }

  // 2) 外部 key（優先用 course_id；若沒有此欄位或查不到，再試 course_key）
  //    你的資料表若只有其中一個欄位也沒關係，另一個查詢會被 try-catch 吃掉。
  try {
    const [r1] = await db.promise().query("SELECT * FROM courses WHERE course_id = ? LIMIT 1", [raw]);
    if (r1[0]) return r1[0];
  } catch (_) {}
  try {
    const [r2] = await db.promise().query("SELECT * FROM courses WHERE course_key = ? LIMIT 1", [raw]);
    if (r2[0]) return r2[0];
  } catch (_) {}

  return null;
}

/** ------------------ 搜尋 ------------------ */
router.get("/search", (req, res) => {
  const query = req.query.query;
  if (!query || query.trim() === "") return res.status(400).send("請提供搜尋關鍵字");

  const keyword = `%${query}%`;
  const sql = `
    SELECT * FROM courses
    WHERE title LIKE ? OR description LIKE ? OR category LIKE ?
    LIMIT 20
  `;

  req.db.query(sql, [keyword, keyword, keyword], (err, results) => {
    if (err) return res.status(500).send("伺服器錯誤");

    results.forEach(course => {
      if (course.image_path) course.image_path = toAbsoluteUrl(course.image_path);
      if (course.video_path) course.video_path = toAbsoluteUrl(course.video_path);
    });

    res.json(results);
  });
});

/** ------------------ 所有課程 ------------------ */
router.get("/", (req, res) => {
  req.db.query("SELECT * FROM courses", (err, results) => {
    if (err) return res.status(500).send(err);
    results.forEach(course => {
      if (course.image_path) course.image_path = toAbsoluteUrl(course.image_path);
      if (course.video_path) course.video_path = toAbsoluteUrl(course.video_path);
    });
    res.json(results);
  });
});

/** ------------------ 分類 ------------------ */
router.get("/category", (req, res) => {
  const categoryParam = req.query.category;

  if (!categoryParam) {
    return res.status(400).send("請提供分類參數，例如 ?category=語言 或 ?category=語言,藝術");
  }

  const categories = categoryParam.split(",").map(c => c.trim());
  const placeholders = categories.map(() => "?").join(", ");
  const sql = `SELECT * FROM courses WHERE category IN (${placeholders})`;

  req.db.query(sql, categories, (err, results) => {
    if (err) return res.status(500).send(err);

    results.forEach(course => {
      if (course.image_path) course.image_path = toAbsoluteUrl(course.image_path);
      if (course.video_path) course.video_path = toAbsoluteUrl(course.video_path);
    });

    res.json(results);
  });
});

/** ------------------ 以外部 key 查課程（推薦/前端 lookup 用） ------------------ */
/** GET /courses/lookup?key=<course-v1:...> 或 ?key=<TsinghuaX+...> */
router.get("/lookup", async (req, res) => {
  const { key } = req.query;
  if (!key) return res.status(400).json({ error: "key required" });
  try {
    const course = await findCourseByAnyId(req.db, key);
    if (!course) return res.status(404).json({ error: "not found" });

    // 補絕對路徑
    if (course.image_path) course.image_path = toAbsoluteUrl(course.image_path);
    if (course.video_path) course.video_path = toAbsoluteUrl(course.video_path);

    // 章節仍用內部 id 綁
    const [chapterRows] = await req.db.promise().query(
      `SELECT id, title, description, position, video_url, duration_sec
       FROM course_chapters
       WHERE course_id = ?
       ORDER BY position ASC, id ASC`,
      [course.id]
    );

    const chapters = chapterRows.map(ch => ({
      id: ch.id,
      title: ch.title,
      description: ch.description,
      position: ch.position,
      video_url: ch.video_url ? toAbsoluteUrl(ch.video_url) : null,
      duration_sec: ch.duration_sec
    }));

    return res.json({ ...course, chapters });
  } catch (e) {
    console.error("lookup error:", e);
    return res.status(500).json({ error: "server error" });
  }
});

/** ------------------ 單一課程（數字 id 或 外部 key 都可） ------------------ */
router.get("/:id", async (req, res) => {
  try {
    const raw = req.params.id; // 可能是 "123" 或 "course-v1:TsinghuaX+..."
    const course = await findCourseByAnyId(req.db, raw);
    if (!course) return res.status(404).send("課程不存在");

    // 補絕對路徑
    if (course.image_path) course.image_path = toAbsoluteUrl(course.image_path);
    if (course.video_path) course.video_path = toAbsoluteUrl(course.video_path);

    // 章節（用內部 id）
    const [chapterRows] = await req.db.promise().query(
      `SELECT id, title, description, position, video_url, duration_sec
       FROM course_chapters
       WHERE course_id = ?
       ORDER BY position ASC, id ASC`,
      [course.id]
    );

    const chapters = chapterRows.map(ch => ({
      id: ch.id,
      title: ch.title,
      description: ch.description,
      position: ch.position,
      video_url: ch.video_url ? toAbsoluteUrl(ch.video_url) : null,
      duration_sec: ch.duration_sec
    }));

    return res.json({ ...course, chapters });
  } catch (e) {
    console.error(e);
    return res.status(500).send("伺服器錯誤");
  }
});

module.exports = router;
