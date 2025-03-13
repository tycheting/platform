var DataTypes = require("sequelize").DataTypes;
var _courses = require("./courses");
var _enrollments = require("./enrollments");
var _ratings = require("./ratings");
var _sequelizemeta = require("./sequelizemeta");
var _users = require("./users");

function initModels(sequelize) {
  var courses = _courses(sequelize, DataTypes);
  var enrollments = _enrollments(sequelize, DataTypes);
  var ratings = _ratings(sequelize, DataTypes);
  var sequelizemeta = _sequelizemeta(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);

  enrollments.belongsTo(courses, { as: "course", foreignKey: "course_id"});
  courses.hasMany(enrollments, { as: "enrollments", foreignKey: "course_id"});
  ratings.belongsTo(courses, { as: "course", foreignKey: "course_id"});
  courses.hasMany(ratings, { as: "ratings", foreignKey: "course_id"});
  enrollments.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(enrollments, { as: "enrollments", foreignKey: "user_id"});
  ratings.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(ratings, { as: "ratings", foreignKey: "user_id"});

  return {
    courses,
    enrollments,
    ratings,
    sequelizemeta,
    users,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
