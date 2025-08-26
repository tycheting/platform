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
      type: DataTypes.ENUM(
        'action_click_about',
        'action_click_courseware',
        'action_click_forum',
        'action_click_info',
        'action_click_progress',
        'action_close_courseware',
        'action_close_forum',
        'action_create_comment',
        'action_create_thread',
        'action_delete_comment',
        'action_delete_thread',
        'action_load_video',
        'action_pause_video',
        'action_play_video',
        'action_problem_check',
        'action_problem_check_correct',
        'action_problem_check_incorrect',
        'action_problem_get',
        'action_problem_save',
        'action_reset_problem',
        'action_seek_video',
        'action_stop_video',
        'unique_session_count',
        'avg_nActions_per_session'
      ),
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
