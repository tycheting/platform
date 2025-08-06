// routes/recommend.js
const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// POST /recommend
router.post('/', (req, res) => {
  const username = req.body.username;
  if (!username) {
    return res.status(400).json({ error: "username is required" });
  }

  const scriptPath = "C:/Users/user/Desktop/project0/f/recommend.py";
  const python = spawn('python', [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });

  python.stdin.write(JSON.stringify({ username }));
  python.stdin.end();

  let result = '';
  let error = '';

  python.stdout.on('data', data => { result += data.toString(); });
  python.stderr.on('data', data => { error += data.toString(); });

  python.on('close', code => {
    if (code !== 0) {
      return res.status(500).json({ error: 'Python script error', details: error });
    }
    try {
      const parsed = JSON.parse(result);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json(parsed);
    } catch (e) {
      res.status(500).json({ error: 'Failed to parse Python output', raw: result });
    }
  });
});

module.exports = router;




// const express = require("express");
// const router = express.Router();

// // 推薦課程（基於相似分類）
// router.get("/:userId", (req, res) => {
//   const userId = req.params.userId;

//   req.db.query(`
//     SELECT DISTINCT c.* FROM courses c
//     JOIN enrollments e ON c.id = e.course_id
//     WHERE e.user_id = ? 
//     ORDER BY RAND() 
//     LIMIT 5
//   `, [userId], (err, results) => {
//     if (err) return res.status(500).send(err);
//     res.json(results);
//   });
// });

// module.exports = router;
