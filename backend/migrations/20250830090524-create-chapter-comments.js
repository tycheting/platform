'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chapter_comments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true },
      chapter_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'course_chapters', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE'
      },
      user_id: { type: Sequelize.INTEGER, allowNull: true },
      body: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      // timestamps: false
    });

    await queryInterface.addIndex('chapter_comments', ['chapter_id', 'created_at'], {
      name: 'idx_chapter_comments_chapter_created'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('chapter_comments', 'idx_chapter_comments_chapter_created');
    await queryInterface.dropTable('chapter_comments');
  }
};
