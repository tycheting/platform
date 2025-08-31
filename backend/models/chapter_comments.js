const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('chapter_comments', {
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
    user_id: { 
      type: DataTypes.INTEGER, 
      allowNull: true 
    },
    body: { 
      type: DataTypes.TEXT, 
      allowNull: false 
    }
  }, {
    sequelize, tableName: 'chapter_comments', 
    timestamps: true,
    underscored: true,
    indexes: [
      { name: 'PRIMARY', unique: true, using: 'BTREE', fields: [{ name: 'id' }] },
      { name: 'idx_chapter_created', using: 'BTREE', fields: [{ name: 'chapter_id' }, { name: 'created_at' }] }
    ]
  });
};
