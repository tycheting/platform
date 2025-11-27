import React, { useEffect, useRef } from "react"; // 1. 引入 useRef
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

import { isTokenExpired, logout, scheduleAutoLogout } from "./auth";

import AppNavbar from './components/AppNavbar';
import Footer from './components/Footer';
import SearchBar from './components/SearchBar';

import Home from './pages/Home';
import Featured from './pages/Featured';
import Courses from './pages/Courses';
import CoursesDetail from './pages/CoursesDetail';
import MyCourses from './pages/MyCourses';
import Login from './pages/Login';
import Register from './pages/Register';
import SearchResults from './pages/SearchResults';

function AppContent() {
  const location = useLocation();
  // 使用 useRef 來確保我們只在該 div 存在時初始化
  const bgInitialized = useRef(false);

  const hideSearchBar =
    location.pathname.startsWith("/courses/") ||
    ["/login", "/register"].includes(location.pathname);

  // --- 原有的驗證邏輯 (保持不變) ---
  useEffect(() => {
    const pathname = location.pathname;
    const isPublicPath =
      pathname === "/" ||
      pathname === "/featured" ||
      pathname === "/courses" ||
      pathname.startsWith("/courses/") ||
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/search";

    if (isPublicPath) {
      if (!isTokenExpired()) {
        scheduleAutoLogout();
      }
      return;
    }

    if (isTokenExpired()) {
      logout();
    } else {
      scheduleAutoLogout();
    }
  }, [location.pathname]);


  // --- 新增：動態背景初始化邏輯 ---
  useEffect(() => {
    // 防止重複初始化
    if (bgInitialized.current) return;

    // 1. 建立 script 標籤
    const script = document.createElement("script");
    script.src = "/ChaosWavesBg.min.js"; // 指向 public 資料夾
    script.async = true;

    // 2. 當 script 載入完成後執行初始化
    script.onload = () => {
      // 確保 window.Color4Bg 存在且容器 div 存在
      if (window.Color4Bg && document.getElementById("chaos-waves-canvas")) {
        try {
          // 初始化特效
          new window.Color4Bg.ChaosWavesBg({
            dom: "chaos-waves-canvas", // 對應下方 div 的 id
            colors: ["#000000", "#ffffff", "#4f4f4f", "#a8a8a8", "#e8e8e8", "#000000"],
            loop: true
          });
          bgInitialized.current = true;
          console.log("Background initialized");
        } catch (e) {
          console.error("背景初始化失敗:", e);
        }
      }
    };

    document.body.appendChild(script);

    // Cleanup: 組件卸載時移除 script (視情況也可不移除，避免換頁閃爍)
    return () => {
      document.body.removeChild(script);
      bgInitialized.current = false;
    };
  }, []); // 空陣列表示只在掛載時執行一次

  return (
    <>
      {/* 背景圖層 
        這裡改為一個空的 div，並給予 ID 讓 JS 抓取
        樣式保持 fixed 和 zIndex: -1 以確保在最底層
      */}
      <div 
        id="chaos-waves-canvas" 
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw', height: '100vh',
          zIndex: -1,
          overflow: 'hidden', // 防止背景溢出捲軸
          backgroundColor: '#000000' // 設定一個預設底色防止載入前白屏
        }}
      ></div>

      {/* 主體內容 (保持不變) */}
      <div className="d-flex flex-column min-vh-100 position-relative" style={{ zIndex: 0 }}>
        <AppNavbar />

        {!hideSearchBar && (
          <div className="d-flex justify-content-center mt-3">
            <SearchBar />
          </div>
        )}

        <div className="main-content flex-grow-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/featured" element={<Featured />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CoursesDetail />} />
            <Route path="/my-courses" element={<MyCourses />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/search" element={<SearchResults />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;