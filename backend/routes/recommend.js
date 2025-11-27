const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// ────────────────────────────────────────────────────────────
// 設定區
// ────────────────────────────────────────────────────────────

// 1. Python 直譯器指令
// 如果你有使用 venv，請將下面這行改成你的 venv python 絕對路徑
// 例如: 'C:\\Users\\user\\Desktop\\project0\\venv\\Scripts\\python.exe'
const PYTHON_CMD = 'C:\\Users\\user\\Desktop\\project0\\venv\\Scripts\\python.exe'; 

// 2. Python 腳本路徑
// 假設 inference_gnn.py 位於專案根目錄 (即 routes 資料夾的上一層)
const SCRIPT_PATH = 'C:\\Users\\user\\Desktop\\project0\\recommend\\inference_gnn.py';


// ────────────────────────────────────────────────────────────
// API: 取得推薦結果
// POST http://localhost:5000/recommend
// Body: { "username": "qwer" }
// ────────────────────────────────────────────────────────────
router.post('/', (req, res) => {
    const { username } = req.body;

    // 簡單的驗證
    if (!username) {
        return res.status(400).json({ 
            status: "error", 
            message: "Username is required" 
        });
    }

    console.log(`[Node.js] 收到推薦請求，使用者: ${username}`);
    console.log(`[Node.js] 執行腳本: ${SCRIPT_PATH}`);

    // 3. 呼叫 Python 子進程
    // 對應 inference_gnn.py 的寫法: sys.argv[1] 接收 username
    const pythonProcess = spawn(PYTHON_CMD, [SCRIPT_PATH, username]);

    let dataString = '';
    let errorString = '';

    // 接收 Python 的標準輸出 (JSON 結果)
    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    // 接收 Python 的錯誤/日誌 (stderr)
    // 注意：GNN 初始化時的一些 info log 也可能會出現在這裡，不一定是報錯
    pythonProcess.stderr.on('data', (data) => {
        const msg = data.toString();
        errorString += msg;
        // 可以在這裡過濾掉一些不重要的 log，只印出真正的錯誤
        if (msg.toLowerCase().includes('error')) {
            console.error(`[Python Error]: ${msg}`);
        } else {
            // console.log(`[Python Log]: ${msg}`); // 想看詳細 log 可以打開
        }
    });

    // Python 執行結束
    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`[Node.js] Python process exited with code ${code}`);
            console.error(`[Node.js] Error details: ${errorString}`);
            
            return res.status(500).json({ 
                status: "error", 
                message: "Recommendation process failed",
                details: errorString
            });
        }

        try {
            // 4. 解析回傳的 JSON
            // 如果 dataString 為空，或是包含非 JSON 的雜訊，這裡會報錯
            if (!dataString.trim()) {
                throw new Error("Python script returned empty result");
            }

            const results = JSON.parse(dataString);

            // 回傳成功結果給前端
            res.json({
                status: "success",
                results: results
            });
            console.log(`[Node.js] 成功回傳 ${results.length} 筆推薦`);

        } catch (e) {
            console.error("[Node.js] JSON Parse Error:", e);
            console.error("[Node.js] Raw Output from Python:", dataString);
            
            // 回傳空的結果，避免前端掛掉，或者回傳錯誤訊息
            res.json({ 
                status: "success", 
                results: [],
                warning: "Parsed error, returning empty list."
            });
        }
    });
});

module.exports = router;