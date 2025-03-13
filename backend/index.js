const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json());

// 與 MySQL 建立連線 (將以下資料替換成你自己的)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'online_course_platform'
});

// 測試連線
db.connect((err) => {
  if (err) {
    console.error('資料庫連線失敗:', err);
    return;
  }
  console.log('成功連線到 MySQL 資料庫');
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