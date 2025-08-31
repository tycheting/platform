const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('chapter_materials', {
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
    title: { 
      type: DataTypes.STRING(255),
      allowNull: false
    },
    type: {                                
      type: DataTypes.ENUM('pdf','slides','link','code','image','file'), // 教材型態
      allowNull: false,
      defaultValue: 'pdf'
    },
    url: {
      type: DataTypes.STRING(1000),
      allowNull: false
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'chapter_materials',
    timestamps: true,
    underscored: true,
    indexes: [
      { 
        name: 'PRIMARY', 
        unique: true, 
        using: 'BTREE', 
        fields: [{ name: 'id' }] 
      },
      { 
        name: 'idx_chapter', 
        using: 'BTREE', 
        fields: [{ name: 'chapter_id' }, { name: 'position' }] 
      }
    ]
  });
};
