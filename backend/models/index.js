'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// ────────────────────────────────────────────────────────────────
// ★★★ 3. 手動補強關聯 (Manual Associations) ★★★
// 這是為了讓推薦系統能透過 user_course_actions 抓到 course 的標題
// ────────────────────────────────────────────────────────────────

// 確保 Model 都有載入成功才執行
const UserCourseAction = db.user_course_actions; // 對應 user_course_action.js 定義的 model name
const Course = db.courses; // 假設你的課程 model name 叫 'courses' 或 'Course'
const User = db.users;     // 假設你的使用者 model name 叫 'users' 或 'User'

if (UserCourseAction && Course) {
  // 建立 "UserCourseAction 屬於 Course" 的關係
  // 這樣查詢時就可以用 include: [{ model: Course, as: 'course' }]
  UserCourseAction.belongsTo(Course, { 
    foreignKey: 'course_id', 
    as: 'course' 
  });
}

if (UserCourseAction && User) {
  // 建立 "UserCourseAction 屬於 User" 的關係
  UserCourseAction.belongsTo(User, { 
    foreignKey: 'user_id', 
    as: 'user' 
  });
}

// (Debug 用) 印出目前載入的 Model 名稱，確保名稱沒打錯
console.log("Loaded Models:", Object.keys(db));

// ────────────────────────────────────────────────────────────────

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
