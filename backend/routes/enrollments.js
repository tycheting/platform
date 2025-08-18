const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");

// 選課（報名課程）
router.post("/", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { courseId } = req.body;

  if (!courseId) return res.status(400).send("缺少課程 ID");

  const sql = "INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)";
  req.db.query(sql, [userId, courseId], (err) => {
    if (err) {
      console.error("選課失敗：", err);
      return res.status(500).send("選課失敗");
    }
    res.send("成功報名課程！");
  });
});

// 更新進度
router.post("/progress", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { courseId, progress } = req.body;

  if (!courseId || progress === undefined) {
    return res.status(400).send("缺少參數");
  }

  const sql = "UPDATE enrollments SET progress = ? WHERE user_id = ? AND course_id = ?";
  req.db.query(sql, [progress, userId, courseId], (err) => {
    if (err) return res.status(500).send("更新失敗");
    res.send("進度已更新！");
  });
});

// 評分課程
router.post("/rate", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { courseId, rating, comment } = req.body;

  if (!courseId || !rating) {
    return res.status(400).send("缺少評分資料");
  }

  const sql = "INSERT INTO ratings (user_id, course_id, rating, comment) VALUES (?, ?, ?, ?)";
  req.db.query(sql, [userId, courseId, rating, comment || ''], (err) => {
    if (err) return res.status(500).send("提交評分失敗");
    res.send("成功提交評分！");
  });
});

module.exports = router;
