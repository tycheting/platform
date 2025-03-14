module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query("ALTER TABLE users AUTO_INCREMENT = 1;");
    await queryInterface.bulkInsert("users", [
      { name: "Alice", email: "alice@example.com", password: "hashed_password", createdAt: new Date(), updatedAt: new Date() },
      { name: "Bob", email: "bob@example.com", password: "hashed_password", createdAt: new Date(), updatedAt: new Date() },
      { name: "Charlie", email: "charlie@example.com", password: "hashed_password", createdAt: new Date(), updatedAt: new Date() },
      { name: "David", email: "david@example.com", password: "hashed_password", createdAt: new Date(), updatedAt: new Date() }
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("users", null, {});
  }
};