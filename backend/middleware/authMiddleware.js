// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "未提供 token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error("JWT 驗證失敗：", err.message);
      return res.status(403).json({ message: "token 驗證失敗" });
    }

    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
