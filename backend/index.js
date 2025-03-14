require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/videos", express.static("public/videos"));

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// 測試連線
db.connect((err) => {
  if (err) {
    console.error('資料庫連線失敗:', err);
    return;
  }
  console.log('成功連線到 MySQL 資料庫');
});

//註冊
app.post("/register", async(req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  db.query("INSERT INTO users ( name, email, password ) VALUES ( ?, ?, ?)",
      [name, email, hashedPassword],
      (err, result) => {
        if(err) return res.status(500).send(err);
        res.send("註冊成功");
      });
});

//登入
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) return res.status(500).send(err);
      if (results.length === 0) return res.status(401).send("用戶不存在");

      const isValid = await bcrypt.compare(password, results[0].password);
      if (!isValid) return res.status(401).send("密碼錯誤");

      const token = jwt.sign({ id: results[0].id }, process.env.SECRET_KEY, { expiresIn: "1h" });
      res.json({ token });
  });
});

//取得所有課程
app.get("/courses", (req, res) => {
  db.query("SELECT * FROM courses", (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
  });
});

//顯示課程詳細資訊
app.get("/courses/:id", (req, res) => {
  const courseId = req.params.id;
  db.query("SELECT * FROM courses WHERE id = ?", [courseId], (err, result) => {
      if (err) {
          console.error("獲取課程失敗:", err);
          return res.status(500).send("獲取課程時發生錯誤");
      }
      if (result.length === 0) return res.status(404).send("課程不存在");

      result[0].video_path = `http://localhost:5000/${result[0].video_path}`;
      res.json(result[0]);
  });
});

//使用者選課
app.post("/enroll", (req, res) => {
  const { userId, courseId } = req.body;

  db.query("INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)", [userId, courseId], 
      (err, result) => {
          if (err) return res.status(500).send(err);
          res.send("成功報名課程！");
  });
});

//記錄使用者進度
app.post("/update-progress", (req, res) => {
  const { userId, courseId, progress } = req.body;

  db.query("UPDATE enrollments SET progress = ? WHERE user_id = ? AND course_id = ?", 
      [progress, userId, courseId], 
      (err, result) => {
          if (err) return res.status(500).send(err);
          res.send("進度已更新！");
  });
});

//用戶評分課程
app.post("/rate-course", (req, res) => {
  const { userId, courseId, rating, comment } = req.body;

  db.query("INSERT INTO ratings (user_id, course_id, rating, comment) VALUES (?, ?, ?, ?)", 
      [userId, courseId, rating, comment], 
      (err, result) => {
          if (err) return res.status(500).send(err);
          res.send("成功提交評分！");
  });
});

//推薦課程（基於相似分類）
app.get("/recommend/:userId", (req, res) => {
  const userId = req.params.userId;

  db.query(`
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

app.get("/search", async (req, res) => {
  try {
      const { category, tag } = req.query;
      let whereClause = {};

      if (category) whereClause.category = category;
      if (tag) whereClause.tags = { [db.Sequelize.Op.contains]: [tag] };

      const courses = await db.Course.findAll({ where: whereClause });
      res.json(courses);
  } catch (err) {
      console.error("課程搜尋失敗:", err);
      res.status(500).send("伺服器錯誤");
  }
});


// 簡單測試用路由
app.get('/', (req, res) => {
  res.send('Hello from Express!');
});

// 啟動伺服器 (預設 port 5000)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`後端伺服器運行中 -> http://localhost:${PORT}`);
});