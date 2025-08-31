'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // 先查出所有課程
    const [courses] = await queryInterface.sequelize.query(
      `SELECT id FROM courses`
    );

    const now = new Date();
    const rowsToInsert = [];

    for (const course of courses) {
      // 找出該課程的第一個章節
      const [chapters] = await queryInterface.sequelize.query(
        `SELECT id 
           FROM course_chapters 
          WHERE course_id = ? 
          ORDER BY position ASC, id ASC 
          LIMIT 1`,
        { replacements: [course.id] }
      );

      if (chapters[0]) {
        rowsToInsert.push({
          chapter_id: chapters[0].id,
          type: 'single',
          question: '1 + 1 等於多少？',
          options: JSON.stringify({
            A: '1',
            B: '2',
            C: '3',
            D: '4'
          }),
          answer: JSON.stringify('B'),   // 正解選項
          explanation: '1 加 1 等於 2，是基本的加法運算。',
          score: 1,
          position: 1,
          created_at: now,
          updated_at: now
        });
      }
    }

    if (rowsToInsert.length > 0) {
      await queryInterface.bulkInsert('chapter_questions', rowsToInsert, {});
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('chapter_questions', {
      question: '1 + 1 等於多少？'
    }, {});
  }
};
