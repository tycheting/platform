const fs = require('fs');
const { Parser } = require('json2csv');
const { sequelize, user_course_actions, users, courses } = require('../models'); // 修改為你的 models 匯出方式

const ACTION_LIST = [
  'action_click_about',
  'action_click_courseware',
  'action_click_forum',
  'action_click_info',
  'action_click_progress',
  'action_close_courseware',
  'action_close_forum',
  'action_create_comment',
  'action_create_thread',
  'action_delete_comment',
  'action_delete_thread',
  'action_load_video',
  'action_pause_video',
  'action_play_video',
  'action_problem_check',
  'action_problem_check_correct',
  'action_problem_check_incorrect',
  'action_problem_get',
  'action_problem_save',
  'action_reset_problem',
  'action_seek_video',
  'action_stop_video',
  'unique_session_count',
  'avg_nActions_per_session'
];

(async () => {
  try {
    // 1. 讀取所有紀錄
    const records = await user_course_actions.findAll({
      attributes: ['user_id', 'course_id', 'action_type'],
      raw: true
    });

    // 2. 建立 user-course 對應動作計數
    const map = {};

    for (const { user_id, course_id, action_type } of records) {
      const key = `${user_id}||${course_id}`;
      if (!map[key]) {
        map[key] = {
          username: user_id,
          course_id: course_id
        };
        ACTION_LIST.forEach(act => map[key][act] = 0);
      }
      if (ACTION_LIST.includes(action_type)) {
        map[key][action_type]++;
      }
    }

    const data = Object.values(map);

    // 3. 匯出成 CSV
    const fields = ['username', 'course_id', ...ACTION_LIST];
    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    fs.writeFileSync('./Train.csv', csv, 'utf-8');
    console.log('Train.csv 匯出成功！');
  } catch (err) {
    console.error('匯出失敗：', err);
  } finally {
    await sequelize.close();
  }
})();
