// migrations/20250831-create-lesson-progress.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('lesson_progress', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      chapter_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'course_chapters', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE'
      },
      watched_sec: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_completed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('lesson_progress', ['user_id', 'chapter_id'], {
      unique: true,
      name: 'uq_user_chapter'
    });
  },
  async down(queryInterface) {
    await queryInterface.removeIndex('lesson_progress', 'uq_user_chapter');
    await queryInterface.dropTable('lesson_progress');
  }
};
