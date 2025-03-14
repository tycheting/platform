module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query("ALTER TABLE courses AUTO_INCREMENT = 1;");
    await queryInterface.bulkInsert("courses", [
      { title: "React 基礎", description: "學習 React 的基礎概念", category: "前端", tags: JSON.stringify(["React", "JavaScript"]), video_path: "videos/testVideo1.mp4", image_path: "images/testImage1.jpg", createdAt: new Date(), updatedAt: new Date() },
      { title: "Node.js API 開發", description: "學習 Express 和 Sequelize", category: "後端", tags: JSON.stringify(["Node.js", "Express", "Sequelize"]), video_path: null, image_path: "images/testImage2.jpg", createdAt: new Date(), updatedAt: new Date() },
      { title: "AI 機器學習", description: "深入了解機器學習", category: "AI", tags: JSON.stringify(["Machine Learning", "Python"]), video_path: null, image_path: "images/testImage3.jpg", createdAt: new Date(), updatedAt: new Date() },
      { title: "Flutter 行動開發", description: "使用 Dart 進行跨平台開發", category: "行動開發", tags: JSON.stringify(["Flutter", "Dart"]), video_path: null, image_path: "images/testImage4.jpg", createdAt: new Date(), updatedAt: new Date() }
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("courses", null, {});
  }
};