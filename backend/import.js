const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { sequelize, courses } = require('./models'); // 調整為你的 models 匯出方式

async function importCourse(csvFilePath) {
  const Course = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          const tags = row.course_keyword.split(',').map(tag => tag.trim()); // 轉 JSON，若是字串用 "["tag1","tag2"]" 格式

          Course.push({
            course_id: row.course_id,
            title: row.course_name,
            description: row.course_syllabus,
            category: row.category,
            tags: tags,
            video_path: '', // 你可以視情況補上預設值
            image_path: '',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } catch (err) {
          console.error('錯誤資料：', row, err);
        }
      })
      .on('end', async () => {
        try {
          await courses.bulkCreate(Course, {
            ignoreDuplicates: true, // 如果你不想重複 course_id 插入
          });
          console.log('成功匯入資料');
          resolve();
        } catch (error) {
          console.error('匯入失敗', error);
          reject(error);
        }
      });
  });
}

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 資料庫連線成功');

    await importCourse(path.join(__dirname, 'course_info_final.csv'));

    await sequelize.close();
  } catch (error) {
    console.error('❌ 發生錯誤：', error);
  }
})();
