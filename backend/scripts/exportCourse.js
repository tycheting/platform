const fs = require("fs");
const path = require("path");
const { stringify } = require("csv-stringify/sync");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const db = require("../models");

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("資料庫連線成功");

    const users = await db.courses.findAll({
      attributes: ["id", "course_id"],
      raw: true
    });

    const csvContent = ["courseid,coursename", ...users.map(u => `${u.id},${u.course_id}`)].join("\n");

    const outputPath = path.join(__dirname, "courses.csv");
    fs.writeFileSync(outputPath, csvContent, "utf8");

    console.log("成功匯出");
  } catch (error) {
    console.error("匯出失敗", error);
  } finally {
    await db.sequelize.close();
  }
})();
