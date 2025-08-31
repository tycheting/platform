'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // 取得所有課程
    const [courses] = await queryInterface.sequelize.query(
      `SELECT id FROM courses`
    );

    const rowsToInsert = [];

    for (const course of courses) {
      // 取該課程的第一章（若你想放到所有章節，請看文末替代版本）
      const [chapters] = await queryInterface.sequelize.query(
        `SELECT id FROM course_chapters 
         WHERE course_id = ? 
         ORDER BY position ASC, id ASC 
         LIMIT 1`,
        { replacements: [course.id] }
      );

      if (chapters[0]) {
        rowsToInsert.push({
          chapter_id: chapters[0].id,
          title: '教材：Hello World',
          type: 'pdf',                           // ✅ 你的 model 使用 ENUM('pdf','slides','link','code','image','file')
          url: '/materials/HelloWorld.pdf',      // ✅ 用 url，而不是 file_path
          // position: 1,                        // 可省略，用預設值；或自行決定排序
          // created_at / updated_at 省略，交給 DB 預設（你前面 migration 已加 default CURRENT_TIMESTAMP）
        });
      }
    }

    if (rowsToInsert.length > 0) {
      await queryInterface.bulkInsert('chapter_materials', rowsToInsert, {});
    }
  },

  async down (queryInterface, Sequelize) {
    // 只刪掉這次塞的教材
    await queryInterface.bulkDelete(
      'chapter_materials',
      { url: '/materials/HelloWorld.pdf' },
      {}
    );
  }
};
