module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert("users", [
      { name: "Alice", email: "alice@example.com", password: "hashed_password", createdAt: new Date(), updatedAt: new Date() },
      { name: "Bob", email: "bob@example.com", password: "hashed_password", createdAt: new Date(), updatedAt: new Date() }
    ]);

    await queryInterface.bulkInsert("courses", [
      { title: "React 基礎", description: "學習 React", category: "Web 開發", video_path: null, createdAt: new Date(), updatedAt: new Date() },
      { title: "Node.js 進階", description: "深入學習 Node.js", category: "後端開發", video_path: "videos/testVideo.mp4", createdAt: new Date(), updatedAt: new Date() }
    ]);

    // await queryInterface.bulkInsert("enrollments", [
    //   { user_id: 1, course_id: 1, progress: 50, createdAt: new Date(), updatedAt: new Date() },
    //   { user_id: 2, course_id: 2, progress: 80, createdAt: new Date(), updatedAt: new Date() }
    // ]);

    // await queryInterface.bulkInsert("ratings", [
    //   { user_id: 1, course_id: 1, rating: 5, comment: "很棒的課程", createdAt: new Date(), updatedAt: new Date() },
    //   { user_id: 2, course_id: 2, rating: 4, comment: "內容不錯", createdAt: new Date(), updatedAt: new Date() }
    // ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("users", null, {});
    await queryInterface.bulkDelete("courses", null, {});
    await queryInterface.bulkDelete("enrollments", null, {});
    await queryInterface.bulkDelete("ratings", null, {});
  }
};