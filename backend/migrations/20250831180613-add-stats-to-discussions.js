'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 新增欄位
    await queryInterface.addColumn('chapter_discussions', 'posts_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn('chapter_discussions', 'last_reply_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // 建議索引
    await queryInterface.addIndex('chapter_discussions', {
      name: 'idx_chapter_pinned_lastreply',
      fields: ['chapter_id', 'pinned', 'last_reply_at'],
      using: 'BTREE'
    });
    await queryInterface.addIndex('chapter_discussions', {
      name: 'idx_chapter_posts_count',
      fields: ['chapter_id', 'posts_count'],
      using: 'BTREE'
    });

    // discussion_posts 建議索引（若尚未）
    await queryInterface.addIndex('discussion_posts', {
      name: 'idx_discussion_parent',
      fields: ['discussion_id', 'parent_id'],
      using: 'BTREE'
    });

    // 以現有資料回填：posts_count / last_reply_at
    // posts_count
    await queryInterface.sequelize.query(`
      UPDATE chapter_discussions d
      LEFT JOIN (
        SELECT discussion_id, COUNT(*) AS cnt, MAX(created_at) AS last_at
        FROM discussion_posts
        GROUP BY discussion_id
      ) p ON p.discussion_id = d.id
      SET d.posts_count = COALESCE(p.cnt, 0),
          d.last_reply_at = COALESCE(p.last_at, d.created_at)
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('chapter_discussions', 'idx_chapter_pinned_lastreply');
    await queryInterface.removeIndex('chapter_discussions', 'idx_chapter_posts_count');
    await queryInterface.removeIndex('discussion_posts', 'idx_discussion_parent');

    await queryInterface.removeColumn('chapter_discussions', 'posts_count');
    await queryInterface.removeColumn('chapter_discussions', 'last_reply_at');
  }
};
