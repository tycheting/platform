module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query("ALTER TABLE ratings AUTO_INCREMENT = 1;");
    await queryInterface.bulkInsert("ratings", [
      { user_id: 1, course_id: 1, rating: 5, comment: "很棒的課程，學到很多！", createdAt: new Date(), updatedAt: new Date() },
      { user_id: 2, course_id: 2, rating: 4, comment: "內容不錯，但可以更深入一些", createdAt: new Date(), updatedAt: new Date() },
      { user_id: 3, course_id: 3, rating: 3, comment: "普通，適合初學者", createdAt: new Date(), updatedAt: new Date() },
      { user_id: 4, course_id: 4, rating: 5, comment: "超棒的課程！期待更多進階內容", createdAt: new Date(), updatedAt: new Date() }
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("ratings", null, {});
  }
};