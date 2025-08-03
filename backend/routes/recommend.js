const express = require("express");
const router = express.Router();

// 推薦課程（基於相似分類）
router.get("/:userId", (req, res) => {
  const userId = req.params.userId;

  req.db.query(`
    SELECT DISTINCT c.* FROM courses c
    JOIN enrollments e ON c.id = e.course_id
    WHERE e.user_id = ? 
    ORDER BY RAND() 
    LIMIT 5
  `, [userId], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

module.exports = router;
