'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 先移除原本的 action_type 欄位
    await queryInterface.removeColumn('user_course_actions', 'action_type');

    // 再新增 ENUM 欄位
    await queryInterface.addColumn('user_course_actions', 'action_type', {
      type: Sequelize.ENUM(
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
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 還原時先移除 ENUM 欄位
    await queryInterface.removeColumn('user_course_actions', 'action_type');

    // 再改回原本的 STRING 欄位（或你之前的型別）
    await queryInterface.addColumn('user_course_actions', 'action_type', {
      type: Sequelize.STRING(50),
      allowNull: false
    });
  }
};
