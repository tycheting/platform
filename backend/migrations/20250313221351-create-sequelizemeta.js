module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("sequelizemeta", {
      name: { type: Sequelize.STRING, primaryKey: true }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("sequelizemeta");
  }
};