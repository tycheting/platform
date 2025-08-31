'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('discussion_posts', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true },
      discussion_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'chapter_discussions', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE'
      },
      user_id: { type: Sequelize.INTEGER, allowNull: true },
      body: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      parent_id: { type: Sequelize.INTEGER, allowNull: true } // 巢狀回覆（不強制 FK，避免刪除時循環；若要 FK 規範可再加）
      // timestamps: false
    });

    await queryInterface.addIndex('discussion_posts', ['discussion_id', 'created_at'], {
      name: 'idx_discussion_posts_discussion_created'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('discussion_posts', 'idx_discussion_posts_discussion_created');
    await queryInterface.dropTable('discussion_posts');
  }
};
