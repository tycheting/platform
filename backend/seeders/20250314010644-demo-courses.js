module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query("ALTER TABLE courses AUTO_INCREMENT = 1;");
    await queryInterface.bulkInsert("courses", [
      {
        title: "從零開始掌握 React！前端開發必學，打造高效動態網站",
        description: "React 是現代前端開發的核心技能之一。本課程從基礎概念開始，逐步帶你掌握元件化設計、狀態管理、React Router，並結合 Hooks 提升開發效率。課程包含實戰專案，幫助你學會如何從零打造專業級動態網站。",
        category: "前端開發",
        tags: JSON.stringify(["React", "JavaScript", "前端框架"]),
        video_path: "videos/testVideo1.mp4",
        image_path: "images/testImage1.jpg",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Node.js API 開發全攻略：從 Express 到 Sequelize，構建強大後端",
        description: "學習如何使用 Node.js + Express.js 來構建高效能後端 API，並結合 Sequelize 進行資料庫操作。課程內容涵蓋身份驗證、中介軟體、RESTful API 設計、錯誤處理與效能優化，讓你具備獨立開發完整後端應用的能力。",
        category: "後端開發",
        tags: JSON.stringify(["Node.js", "Express", "Sequelize", "API"]),
        video_path: null,
        image_path: "images/testImage2.jpg",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "AI 機器學習：從理論到實戰，掌握 Python 與數據科學應用",
        description: "人工智慧與機器學習已成為當代科技的關鍵趨勢。本課程將帶你學習核心概念，包括監督式學習、非監督式學習、深度學習與神經網路。我們會使用 Python 及 Scikit-Learn 進行數據分析與模型訓練，助你掌握 AI 應用的實戰技巧。",
        category: "人工智慧與機器學習",
        tags: JSON.stringify(["Machine Learning", "Python", "數據科學"]),
        video_path: null,
        image_path: "images/testImage3.jpg",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Flutter 行動開發：一次學會 iOS & Android 跨平台 App 開發",
        description: "Flutter 是目前最受歡迎的跨平台行動開發框架之一，能夠幫助開發者一次撰寫程式碼，快速發布至 iOS 與 Android。本課程將從 Dart 語言開始，帶你學會 Flutter 小部件（Widgets）、狀態管理、API 整合、導航與資料儲存，讓你能夠從零打造自己的行動應用程式。",
        category: "行動應用開發",
        tags: JSON.stringify(["Flutter", "Dart", "iOS", "Android"]),
        video_path: null,
        image_path: "images/testImage4.jpg",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "全球頂尖企業都在用！零錯誤思維 2.0",
        description: "成功不能複製，但失敗可以避免。持續不犯錯，才是成就卓越的關鍵！麻省理工專家團隊研發，分析超過 8 萬筆大數據，「零錯誤」科學方法論成為 80% 以上美國 500 強企業採用的頂尖企業指定課程。",
        category: "商業策略",
        tags: JSON.stringify(["企業管理", "決策思維", "錯誤管理"]),
        video_path: null,
        image_path: "images/testImage5.jpg",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "文案寫作：從需求出發，帶創意回來",
        description: "這堂課會從讀者的「需求」出發，把「創意」帶回你的文案中；用六個步驟寫出有人關注、有人傳播、有人買單的創意文案！",
        category: "寫作與內容行銷",
        tags: JSON.stringify(["文案技巧", "行銷", "品牌建立"]),
        video_path: null,
        image_path: "images/testImage6.jpg",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "頂級心理學：破解人類行為的黃金法則",
        description: "從 FBI 行為科學專家的研究出發，解析人類決策與行為模式，讓你在職場、商業、談判中獲得關鍵優勢！",
        category: "心理學",
        tags: JSON.stringify(["行為心理學", "人際溝通", "決策科學"]),
        video_path: null,
        image_path: "images/testImage7.jpg",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "財務自由計畫：讓錢自動為你工作",
        description: "富人不是賺得多，而是懂得如何讓錢滾錢。本課程揭露全球投資大師的致富策略，幫助你建立穩定被動收入，早日財務自由！",
        category: "財務與投資",
        tags: JSON.stringify(["投資理財", "財務管理", "被動收入"]),
        video_path: null,
        image_path: "images/testImage8.jpg",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "超越自我！運用習慣科學改變人生",
        description: "想成功，先改變習慣！學習世界頂尖運動員、企業家如何透過習慣管理，讓目標達成率提高 10 倍！",
        category: "個人成長",
        tags: JSON.stringify(["習慣養成", "高效能", "自我提升"]),
        video_path: null,
        image_path: "images/testImage9.jpg",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "藝術賞析：用你的眼睛聽懂世界名畫",
        description: "你真的「看懂」藝術了嗎？這堂課將帶你解析世界名畫的隱藏訊息、色彩心理學、構圖邏輯，讓你用全新的角度欣賞藝術！",
        category: "藝術與設計",
        tags: JSON.stringify(["美學", "藝術鑑賞", "設計思維"]),
        video_path: null,
        image_path: "images/testImage10.jpg",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "精準溝通術：讓人不自覺地喜歡你",
        description: "與其努力讓自己變得有趣，不如學會讓別人感覺自己很聰明。本課程教你如何透過溝通技巧，快速建立連結，影響別人！",
        category: "人際關係",
        tags: JSON.stringify(["溝通技巧", "社交心理學", "談判術"]),
        video_path: null,
        image_path: "images/testImage11.jpg",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("courses", null, {});
  }
};