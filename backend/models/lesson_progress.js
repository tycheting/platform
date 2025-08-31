const Sequelize = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('lesson_progress', {
    id: { 
      autoIncrement: true, 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      primaryKey: true 
    },
    user_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
    chapter_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
    watched_sec: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      defaultValue: 0 
    },
    is_completed: { 
      type: DataTypes.BOOLEAN, 
      allowNull: false, 
      defaultValue: false 
    }
  }, {
    tableName: 'lesson_progress',
    timestamps: true,
    underscored: true,
    indexes: [{ name: 'uq_user_chapter', unique: true, fields: ['user_id','chapter_id'] }]
  });
};
