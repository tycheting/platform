const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('discussion_posts', {
    id: {
      autoIncrement: true, 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      primaryKey: true 
    },
    discussion_id: {
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'chapter_discussions', key: 'id' }, 
      onDelete: 'CASCADE'
    },
    user_id: { 
      type: DataTypes.INTEGER, 
      allowNull: true 
    },
    body: { 
      type: DataTypes.TEXT, 
      allowNull: false 
    },
    parent_id: { 
      type: DataTypes.INTEGER, 
      allowNull: true 
    } // 選填：支援巢狀回覆（引用同表 id）
  }, {
    sequelize, tableName: 'discussion_posts', 
    timestamps: true,
    underscored: true,
    indexes: [
      { name: 'PRIMARY', unique: true, using: 'BTREE', fields: [{ name: 'id' }] },
      { name: 'idx_discussion_created', using: 'BTREE', fields: [{ name: 'discussion_id' }, { name: 'created_at' }] },
      { name: 'idx_discussion_parent', using: 'BTREE', fields: [{ name: 'discussion_id' }, { name: 'parent_id' }] }
    ]
  });
};
