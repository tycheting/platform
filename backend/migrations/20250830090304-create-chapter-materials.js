'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chapter_materials', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true },
      chapter_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'course_chapters', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE'
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      type: {
        type: Sequelize.ENUM('pdf','slides','link','code','image','file'),
        allowNull: false, defaultValue: 'pdf'
      },
      url: { type: Sequelize.STRING(1000), allowNull: false },
      position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 }
      // timestamps: false
    });

    await queryInterface.addIndex('chapter_materials', ['chapter_id', 'position'], {
      name: 'idx_chapter_materials_chapter_position',
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('chapter_materials', 'idx_chapter_materials_chapter_position');
    await queryInterface.dropTable('chapter_materials');
    // 移除 ENUM（部分資料庫需要顯式清理），在 MySQL 不需要；若是 Postgres 可加：
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_chapter_materials_type";');
  }
};
