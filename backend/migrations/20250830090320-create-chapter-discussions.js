'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chapter_discussions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true },
      chapter_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'course_chapters', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE'
      },
      user_id: { type: Sequelize.INTEGER, allowNull: true }, // 若有 users 表可再加 FK
      title: { type: Sequelize.STRING(255), allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: true },
      pinned: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      // timestamps: false
    });

    await queryInterface.addIndex('chapter_discussions', ['chapter_id', 'created_at'], {
      name: 'idx_chapter_discussions_chapter_created'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('chapter_discussions', 'idx_chapter_discussions_chapter_created');
    await queryInterface.dropTable('chapter_discussions');
  }
};
