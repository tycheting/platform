const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('user_course_actions', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    action_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    tableName: 'user_course_actions',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [{ name: "id" }]
      },
      {
        name: "user_course_index",
        using: "BTREE",
        fields: [{ name: "user_id" }, { name: "course_id" }]
      }
    ]
  });
};
