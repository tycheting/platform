'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // 把所有課程抓出來
    const [courses] = await queryInterface.sequelize.query(
      `SELECT id, course_id FROM courses`
    );

    const chapters = [];
    const now = new Date();

    for (const course of courses) {
      for (let i = 1; i <= 10; i++) {
        chapters.push({
          course_id: course.id,
          title: `第${i}章`,
          description: `這是課程 ${course.course_id} 的第 ${i} 章內容`,
          position: i,
          video_url: `/videos/default_course.mp4`,   //`/videos/${course.course_id}_chapter${i}.mp4`,
          duration_sec: 60, // 假設每章 10 分鐘，600 秒
        });
      }
    }

    if (chapters.length > 0) {
      await queryInterface.bulkInsert('course_chapters', chapters, {});
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('course_chapters', null, {});
  }
};
