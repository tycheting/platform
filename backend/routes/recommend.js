const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// 假設你的資料庫連線物件叫做 db
// const db = require('../db'); // 請依你的專案實際位置引入 DB 連線

const db = require('../models');
const User = db.users || db.User; 
const Course = db.courses || db.Course;
const UserCourseAction = db.user_course_actions || db.UserCourseAction;

const PYTHON_EXE = 'C:\\Users\\user\\Desktop\\project0\\venv\\Scripts\\python.exe';
const PROJECT_ROOT = 'C:\\Users\\user\\Desktop\\project0';
const RECOMMEND_SCRIPT = path.join(PROJECT_ROOT, 'recommend', 'recommend.py');
const PIPELINE_SCRIPT = path.join(PROJECT_ROOT, 'run_pipeline.py');

// ──────────────────────────────────────────────
// API 1: 執行推薦 (加入即時行為判定)
// ──────────────────────────────────────────────
// ★ 注意：這裡改成 async，因為要等待資料庫查詢
router.post('/', async (req, res) => {
  const username = req.body.username;
  let query = req.body.query || ""; // 使用者手動輸入的搜尋 (優先級最高)
  const topk = req.body.topk || 20;

  if (!username) {
    return res.status(400).json({ error: "username is required" });
  }

  // ────────────────────────────────────────────────────────────
  // ★ 新增邏輯：如果使用者沒有手動搜尋，就去撈「最近互動」
  // ────────────────────────────────────────────────────────────
  if (!query) {
    try {
      // 1. 先從 username 找到 user_id
      const userRecord = await User.findOne({ 
        where: { name: username }, // 假設你的 user table 欄位是 username
        attributes: ['id']
      });

      if (userRecord) {
        // 2. 查詢該使用者的最近操作紀錄
        const recentActions = await UserCourseAction.findAll({
          where: { user_id: userRecord.id },
          // 關聯查詢：把 Course 的資料也抓進來
          include: [{
            model: Course,
            as: 'course', // 必須對應 models/index.js 裡的 alias
            attributes: ['title'] // 抓取標題欄位 (看你資料庫是 title 還是 course_name)
          }],
          order: [['timestamp', 'DESC']], // 依時間倒序
          limit: 10 // 先抓 10 筆，因為可能有重複的課程
        });

        if (recentActions.length > 0) {
          // 3. 資料處理：過濾重複的課程名稱
          // 使用 Set 來去重
          const uniqueCourses = new Set();
          
          recentActions.forEach(action => {
            // 根據你的 Course table 定義，可能是 title 或 course_name
            const courseName = action.course?.title;
            if (courseName) {
              uniqueCourses.add(courseName);
            }
          });

          // 取前 3 個不重複的課程
          const topCourses = Array.from(uniqueCourses).slice(0, 3);

          if (topCourses.length > 0) {
            const courseString = topCourses.join("、");
            // 4. 生成 Prompt
            query = `我最近剛剛瀏覽並操作了：${courseString}。請根據這些興趣推薦類似的進階或相關課程。`;
            console.log(`[Backend] DB 查詢成功，生成即時 Query: ${query}`);
          }
        }
      } else {
        console.log(`[Backend] 找不到使用者 ID: ${username}，跳過即時查詢`);
      }

    } catch (dbError) {
      console.error("[Backend] 資料庫查詢失敗:", dbError);
      // 保持 query 為空，讓 Python 跑預設邏輯
    }
  }

  // ────────────────────────────────────────────────────────────
  // 以下維持原樣，呼叫 Python
  // ────────────────────────────────────────────────────────────
  const inputData = JSON.stringify({ 
    username, 
    query, // 這裡的 query 可能包含了我們剛剛生成的「即時興趣」
    topk,
    mode: "hybrid"
  });

  const python = spawn(PYTHON_EXE, [RECOMMEND_SCRIPT], { stdio: ['pipe', 'pipe', 'pipe'] });

  python.stdin.write(inputData);
  python.stdin.end();

  let result = '';
  let error = '';

  python.stdout.setEncoding('utf8');
  python.stderr.setEncoding('utf8');

  python.stdout.on('data', (data) => { result += data; });
  python.stderr.on('data', (data) => { error += data; });

  python.on('close', (code) => {
    if (code !== 0) {
      console.error(`Python error (${code}):`, error);
      return res.status(500).json({ error: 'Recommendation failed', details: error });
    }
    try {
      const parsed = JSON.parse(result);
      res.json(parsed);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      console.error("Raw Output:", result);
      res.status(500).json({ error: 'Invalid JSON from Python', raw: result });
    }
  });
});

// ──────────────────────────────────────────────
// API 2: 更新模型流程 (給管理員用，會跑很久)
// POST /api/recommend/run-pipeline
// ──────────────────────────────────────────────
router.post('/run-pipeline', (req, res) => {
  console.log("正在啟動 Pipeline...");

  // 為了避免瀏覽器 Timeout，我們先回傳「開始執行」
  // 但如果你希望前端等待結果，可以把 res.json 移到 close 裡面 (不建議)
  res.json({ message: "Pipeline started in background. Check server logs for progress." });

  const pipeline = spawn(PYTHON_EXE, [PIPELINE_SCRIPT], { 
    cwd: PROJECT_ROOT, // 確保在正確目錄執行
    stdio: 'inherit'   // 直接把 log 印在 Node.js 的 console 上方便你看
  });

  pipeline.on('close', (code) => {
    if (code === 0) {
      console.log("✅ Pipeline 執行成功！模型已更新。");
    } else {
      console.error("❌ Pipeline 執行失敗，Exit Code:", code);
    }
  });
});

module.exports = router;