'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chapter_questions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true },
      chapter_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'course_chapters', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('single','multiple','true_false','short_answer'),
        allowNull: false, defaultValue: 'single'
      },
      question: { type: Sequelize.TEXT, allowNull: false },
      options: { type: Sequelize.JSON, allowNull: true },
      answer: { type: Sequelize.JSON, allowNull: true },
      explanation: { type: Sequelize.TEXT, allowNull: true },
      score: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 }
      // timestamps: false
    });

    await queryInterface.addIndex('chapter_questions', ['chapter_id', 'position'], {
      name: 'idx_chapter_questions_chapter_position',
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('chapter_questions', 'idx_chapter_questions_chapter_position');
    await queryInterface.dropTable('chapter_questions');
    // Postgres 才需要顯式清 enum：
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_chapter_questions_type";');
  }
};
