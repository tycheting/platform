module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("courses", "image_path", {
      type: Sequelize.STRING,
      allowNull: true // 可以允許沒有圖片
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("courses", "image_path");
  }
};
