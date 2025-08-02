// routes/search.js
const express = require("express");
const router = express.Router();
const { courses } = require("../models"); // 自動載入 model，名稱小寫是因為你定義時是 'courses'
const { Op } = require("sequelize");

router.get("/", async (req, res) => {
  const query = req.query.query || "";

  try {
    const results = await courses.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } },
          { category: { [Op.like]: `%${query}%` } }
        ]
      },
      limit: 20
    });

    res.json(results);
  } catch (error) {
    console.error("搜尋失敗:", error);
    res.status(500).json({ error: "搜尋時發生錯誤" });
  }
});

module.exports = router;
