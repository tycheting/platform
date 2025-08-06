const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer token 取第二段

  if (!token) {
    return res.status(401).send("未提供權杖");
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) return res.status(403).send("權杖驗證失敗");

    req.user = user; // 存到 req 中供下一個 middleware 或路由使用
    next();
  });
}

module.exports = authenticateToken;
