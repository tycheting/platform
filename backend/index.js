require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/videos", express.static("public/videos"));
app.use("/images", express.static("public/images"));

// 資料庫連線
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) return console.error("資料庫連線失敗:", err);
  console.log("成功連線到 MySQL 資料庫");
});

// 資料庫注入中介層
app.use((req, res, next) => {
  req.db = db;
  next();
});

// 路由掛載
app.use("/auth", require("./routes/auth"));
app.use("/courses", require("./routes/courses"));
app.use("/enroll", require("./routes/enrollments"));
app.use("/recommend", require("./routes/recommend"));

// 測試首頁
app.get("/", (req, res) => res.send("Hello from Express!"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`伺服器運行中：http://localhost:${PORT}`);
});
