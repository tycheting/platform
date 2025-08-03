const express = require("express");
const router = express.Router();

// 所有課程
router.get("/", (req, res) => {
  req.db.query("SELECT * FROM courses", (err, results) => {
    if (err) return res.status(500).send(err);
    results.forEach(course => {
      if (course.image_path) {
        course.image_path = `http://localhost:5000/${course.image_path}`;
      }
    });
    res.json(results);
  });
});

// 單一課程
router.get("/:id", (req, res) => {
  const courseId = req.params.id;
  req.db.query("SELECT * FROM courses WHERE id = ?", [courseId], (err, result) => {
    if (err) return res.status(500).send("獲取課程錯誤");
    if (result.length === 0) return res.status(404).send("課程不存在");

    result[0].video_path = `http://localhost:5000/${result[0].video_path}`;
    result[0].image_path = `http://localhost:5000/${result[0].image_path}`;
    res.json(result[0]);
  });
});

// 分類
// 支援單一或多分類查詢：/courses/category?category=語言 或 category=語言,藝術
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
      if (course.image_path) {
        course.image_path = `http://localhost:5000/${course.image_path}`;
      }
    });

    res.json(results);
  });
});


// 搜尋（標題、描述、類別）
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
      if (course.image_path) {
        course.image_path = `http://localhost:5000/${course.image_path}`;
      }
    });

    res.json(results);
  });
});

module.exports = router;
