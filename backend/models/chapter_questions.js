const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('chapter_questions', {
    id: { 
      autoIncrement: true, 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      primaryKey: true 
    },
    chapter_id: {
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'course_chapters', key: 'id' }, 
      onDelete: 'CASCADE'
    },
    type: {  // 題型
      type: DataTypes.ENUM('single','multiple','true_false','short_answer'),
      allowNull: false, 
      defaultValue: 'single'
    },
    question: {
      type: DataTypes.TEXT, 
      allowNull: false 
    },
    options: {
      type: DataTypes.JSON, 
      allowNull: true 
    },               // 選項（單/複選時使用）
    answer: { 
      type: DataTypes.JSON, 
      allowNull: true 
    },                // 正解（單選: "A"；複選: ["A","C"]；是非: true/false）
    explanation: { 
      type: DataTypes.TEXT, 
      allowNull: true 
    },
    score: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      defaultValue: 1 
    },
    position: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      defaultValue: 1 
    }
  }, {
    sequelize, tableName: 'chapter_questions', 
    timestamps: true,
    underscored: true,
    indexes: [
      { name: 'PRIMARY', unique: true, using: 'BTREE', fields: [{ name: 'id' }] },
      { name: 'idx_chapter_pos', using: 'BTREE', fields: [{ name: 'chapter_id' }, { name: 'position' }] }
    ]
  });
};
