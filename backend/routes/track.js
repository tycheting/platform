const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");

// POST /track
router.post("/", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { courseId, actionType } = req.body;

  if (!courseId || !actionType) {
    return res.status(400).send("缺少 courseId 或 actionType");
  }

  const query = `
    INSERT INTO user_course_actions (user_id, course_id, action_type)
    VALUES (?, ?, ?)
  `;

  req.db.query(query, [userId, courseId, actionType], (err) => {
    if (err) {
      console.error("紀錄行為失敗:", err);
      return res.status(500).send("紀錄失敗");
    }
    res.send("紀錄成功");
  });
});

module.exports = router;
