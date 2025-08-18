const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");

// GET /user/my-courses → 顯示該用戶的課程與行為
router.get("/my-courses", authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT 
      c.id AS course_id,
      c.title,
      c.description,
      c.image_path,
      c.video_path,
      a.action_type,
      a.timestamp
    FROM user_course_actions a
    JOIN courses c ON a.course_id = c.id
    WHERE a.user_id = ?
    ORDER BY a.timestamp DESC
  `;

  req.db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).send("查詢失敗");

    results.forEach(course => {
      if (course.image_path) {
        course.image_path = `http://localhost:5000/${course.image_path}`;
      }
      if (course.video_path) {
        course.video_path = `http://localhost:5000/${course.video_path}`;
      }
    });

    res.json(results);
  });
});

module.exports = router;
