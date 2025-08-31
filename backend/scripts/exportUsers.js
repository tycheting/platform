// scripts/exportUsers.js

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const db = require("../models");

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("資料庫連線成功");

    const users = await db.users.findAll({
      attributes: ["id", "name"],
      raw: true
    });

    const csvContent = ["userid,username", ...users.map(u => `${u.id},${u.name}`)].join("\n");

    const outputPath = path.join(__dirname, "export_users.csv");
    fs.writeFileSync(outputPath, csvContent, "utf8");

    console.log("成功匯出");
  } catch (error) {
    console.error("匯出失敗", error);
  } finally {
    await db.sequelize.close();
  }
})();
