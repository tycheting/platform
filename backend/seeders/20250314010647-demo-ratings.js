module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query("ALTER TABLE ratings AUTO_INCREMENT = 1;");
    await queryInterface.bulkInsert("ratings", [
      { user_id: 1, course_id: 1, rating: 5, comment: "很棒的課程，學到很多！", createdAt: new Date(), updatedAt: new Date() },
      { user_id: 2, course_id: 2, rating: 4, comment: "內容不錯，但可以更深入一些", createdAt: new Date(), updatedAt: new Date() },
      { user_id: 3, course_id: 3, rating: 3, comment: "普通，適合初學者", createdAt: new Date(), updatedAt: new Date() },
      { user_id: 4, course_id: 4, rating: 5, comment: "超棒的課程！期待更多進階內容", createdAt: new Date(), updatedAt: new Date() },
      { user_id: 1, course_id: 5, rating: 5, comment: "內容很實用，案例豐富，讓我對企業決策有全新的認識！", createdAt: new Date(), updatedAt: new Date() },
      { user_id: 2, course_id: 6, rating: 4, comment: "寫作方法簡單易懂，實際應用後文案點擊率提升了！", createdAt: new Date(), updatedAt: new Date() },
      { user_id: 3, course_id: 7, rating: 5, comment: "心理學知識應用在談判中效果驚人，推薦給所有業務與談判人員！", createdAt: new Date(), updatedAt: new Date() },
      { user_id: 4, course_id: 8, rating: 3, comment: "投資概念不錯，但部分內容偏向基礎，適合初學者", createdAt: new Date(), updatedAt: new Date() },
      { user_id: 1, course_id: 9, rating: 5, comment: "習慣改變真的影響人生，這堂課讓我學到如何養成高效能習慣！", createdAt: new Date(), updatedAt: new Date() },
      { user_id: 2, course_id: 10, rating: 4, comment: "藝術賞析的內容讓我對畫作有更深的理解，非常推薦！", createdAt: new Date(), updatedAt: new Date() },
      { user_id: 3, course_id: 11, rating: 5, comment: "溝通術真的有用，照著課程的方法練習，社交能力提升不少！", createdAt: new Date(), updatedAt: new Date() }
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("ratings", null, {});
  }
};