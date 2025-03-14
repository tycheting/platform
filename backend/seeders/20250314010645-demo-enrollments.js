module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query("ALTER TABLE enrollments AUTO_INCREMENT = 1;");
    await queryInterface.bulkInsert("enrollments", [
      { user_id: 1, course_id: 1, progress: 25, createdAt: new Date(), updatedAt: new Date() },
      { user_id: 2, course_id: 2, progress: 50, createdAt: new Date(), updatedAt: new Date() },
      { user_id: 3, course_id: 3, progress: 75, createdAt: new Date(), updatedAt: new Date() },
      { user_id: 4, course_id: 4, progress: 90, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("enrollments", null, {});
  }
};