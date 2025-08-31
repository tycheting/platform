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

/** ------------------ 單一課程（含章節） ------------------ */
router.get("/:id", async (req, res) => {
  const courseId = Number(req.params.id);
  if (!Number.isInteger(courseId)) {
    return res.status(400).send("課程 ID 無效");
  }

  try {
    // 1) 查課程
    const [courseRows] = await req.db.promise().query(
      "SELECT * FROM courses WHERE id = ?",
      [courseId]
    );
    if (!courseRows[0]) return res.status(404).send("課程不存在");

    const course = courseRows[0];

    // 補絕對路徑
    if (course.image_path) course.image_path = toAbsoluteUrl(course.image_path);
    if (course.video_path) course.video_path = toAbsoluteUrl(course.video_path);

    // 2) 查章節
    const [chapterRows] = await req.db.promise().query(
      `SELECT id, title, description, position, video_url, duration_sec
       FROM course_chapters
       WHERE course_id = ?
       ORDER BY position ASC, id ASC`,
      [courseId]
    );

    const chapters = chapterRows.map(ch => ({
      id: ch.id,
      title: ch.title,
      description: ch.description,
      position: ch.position,
      video_url: ch.video_url ? toAbsoluteUrl(ch.video_url) : null,
      duration_sec: ch.duration_sec
    }));

    return res.json({
      ...course,
      chapters
    });
  } catch (e) {
    console.error(e);
    return res.status(500).send("伺服器錯誤");
  }
});

module.exports = router;
