const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('course_chapters', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,   // 章節排序 (第幾章)
    },
    video_url: {
      type: DataTypes.STRING(1000),
      allowNull: false,   // 每章節的影片
    },
    duration_sec: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,   // 影片長度 (秒)，可選
    },
  }, {
    sequelize,
    tableName: 'course_chapters',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [{ name: "id" }],
      },
      {
        name: "idx_course",
        using: "BTREE",
        fields: [{ name: "course_id" }],
      },
    ],
  });
};
