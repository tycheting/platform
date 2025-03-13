module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("enrollments", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: "users", key: "id" }, onDelete: "CASCADE" },
      course_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: "courses", key: "id" }, onDelete: "CASCADE" },
      progress: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("enrollments");
  }
};