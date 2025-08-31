const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('chapter_discussions', {
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
    },            // 開帖者（若你有 users 表）
    title: { 
      type: DataTypes.STRING(255), 
      allowNull: false 
    },
    body: { 
      type: DataTypes.TEXT, 
      allowNull: true 
    },
    pinned: { 
      type: DataTypes.BOOLEAN, 
      allowNull: false, 
      defaultValue: false 
    },
    posts_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    last_reply_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize, tableName: 'chapter_discussions', 
    timestamps: true,
    underscored: true,
    indexes: [
      { name: 'PRIMARY', unique: true, using: 'BTREE', fields: [{ name: 'id' }] },
      { name: 'idx_chapter_created', using: 'BTREE', fields: [{ name: 'chapter_id' }, { name: 'created_at' }] },
      { name: 'idx_chapter_pinned_lastreply', using: 'BTREE', fields: [{ name: 'chapter_id' }, { name: 'pinned' }, { name: 'last_reply_at' }] },
      { name: 'idx_chapter_posts_count', using: 'BTREE', fields: [{ name: 'chapter_id' }, { name: 'posts_count' }] }
    ]
  });
};
