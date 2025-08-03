const express = require("express");
const router = express.Router();

// 報名課程
router.post("/", (req, res) => {
  const { userId, courseId } = req.body;
  req.db.query("INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)", [userId, courseId],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("成功報名課程！");
    });
});

// 更新進度
router.post("/progress", (req, res) => {
  const { userId, courseId, progress } = req.body;
  req.db.query("UPDATE enrollments SET progress = ? WHERE user_id = ? AND course_id = ?",
    [progress, userId, courseId],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("進度已更新！");
    });
});

// 評分課程
router.post("/rate", (req, res) => {
  const { userId, courseId, rating, comment } = req.body;
  req.db.query("INSERT INTO ratings (user_id, course_id, rating, comment) VALUES (?, ?, ?, ?)",
    [userId, courseId, rating, comment],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("成功提交評分！");
    });
});

module.exports = router;
