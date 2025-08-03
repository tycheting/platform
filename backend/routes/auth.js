const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 註冊
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  req.db.query(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, hashedPassword],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("註冊成功");
    }
  );
});

// 登入
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  req.db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).send(err);
    if (results.length === 0) return res.status(401).send("用戶不存在");

    const isValid = await bcrypt.compare(password, results[0].password);
    if (!isValid) return res.status(401).send("密碼錯誤");

    const token = jwt.sign({ id: results[0].id }, process.env.SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
  });
});

module.exports = router;
