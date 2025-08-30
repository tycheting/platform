// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 註冊（含自動登入）
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    req.db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
      (err) => {
        if (err) return res.status(500).send(err);

        req.db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
          if (err) return res.status(500).send(err);
          const user = results[0];

          const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: "72h" }
          );

          res.json({
            msg: "註冊成功",
            token
          });
        });
      }
    );
  } catch (err) {
    res.status(500).send("註冊失敗");
  }
});

// 登入
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  req.db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).send("伺服器錯誤：查詢失敗");
    if (results.length === 0) return res.status(401).send("用戶不存在");

    try {
      const user = results[0];
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return res.status(401).send("密碼錯誤");

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: "72h" }
      );

      res.json({ token });
    } catch (e) {
      return res.status(500).send("登入錯誤");
    }
  });
});

module.exports = router;
