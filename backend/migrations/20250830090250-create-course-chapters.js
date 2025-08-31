'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('course_chapters', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true },
      course_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'courses', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE'
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      position: { type: Sequelize.INTEGER, allowNull: false }, // 章節排序
      video_url: { type: Sequelize.STRING(1000), allowNull: false },
      duration_sec: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 }
      // timestamps: false
    });

    // 常用索引 / 唯一約束（同課程內章節排序不可重複）
    await queryInterface.addIndex('course_chapters', ['course_id', 'position'], {
      name: 'idx_course_chapters_course_position',
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('course_chapters', 'idx_course_chapters_course_position');
    await queryInterface.dropTable('course_chapters');
  }
};
