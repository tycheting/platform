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

// 分類查詢
router.get("/category/:category", (req, res) => {
  const category = req.params.category;

  req.db.query("SELECT * FROM courses WHERE category = ?", [category], (err, results) => {
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
