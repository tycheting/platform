'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 工具：檢查欄位是否存在
    async function columnExists(table, column) {
      const [rows] = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM \`${table}\` LIKE :column`,
        { replacements: { column } }
      );
      return rows.length > 0;
    }

    // 工具：如果欄位不存在才新增
    async function addColumnIfNotExists(table, column, definition) {
      if (!(await columnExists(table, column))) {
        await queryInterface.addColumn(table, column, definition);
      }
    }

    // 想要處理的所有資料表
    const tables = [
      'course_chapters',
      'lesson_progress',
      'chapter_materials',
      'chapter_discussions',
      'discussion_posts',
      'chapter_questions',
      'chapter_comments'
    ];

    // 對每個表做檢查與新增
    for (const table of tables) {
      await addColumnIfNotExists(table, 'created_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      });

      await addColumnIfNotExists(table, 'updated_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      });
    }
  },

  async down(queryInterface /*, Sequelize */) {
    // 工具：檢查欄位是否存在
    async function columnExists(table, column) {
      const [rows] = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM \`${table}\` LIKE :column`,
        { replacements: { column } }
      );
      return rows.length > 0;
    }

    // 工具：如果欄位存在才移除（避免某些表本來就沒有）
    async function removeColumnIfExists(table, column) {
      if (await columnExists(table, column)) {
        await queryInterface.removeColumn(table, column);
      }
    }

    const tables = [
      'course_chapters',
      'lesson_progress',
      'chapter_materials',
      'chapter_discussions',
      'discussion_posts',
      'chapter_questions',
      'chapter_comments'
    ];

    for (const table of tables) {
      await removeColumnIfExists(table, 'created_at');
      await removeColumnIfExists(table, 'updated_at');
    }
  }
};
