// src/App.js
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import { isTokenExpired, logout, scheduleAutoLogout } from "./auth";

import AppNavbar from "./components/AppNavbar";
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";

import Home from "./pages/Home";
import Featured from "./pages/Featured";
import Courses from "./pages/Courses";
import CoursesDetail from "./pages/CoursesDetail"; // 你的現有詳情頁（播放器＋章節清單）
import MyCourses from "./pages/MyCourses";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SearchResults from "./pages/SearchResults";

// 新增：課程子頁（分拆版）
import CourseInfo from "./pages/course/CourseInfo";
import CourseProgress from "./pages/course/CourseProgress";
import CourseMaterials from "./pages/course/CourseMaterials";
import CourseProblems from "./pages/course/CourseProblems";
import CourseDiscussion from "./pages/course/CourseDiscussion";
import CourseComments from "./pages/course/CourseComments";

function AppContent() {
  const location = useLocation();

  // 在所有 /courses/... 頁面隱藏首頁搜尋列（維持你的規則）
  const hideSearchBar =
    location.pathname.startsWith("/courses/") ||
    ["/login", "/register"].includes(location.pathname);

  useEffect(() => {
    const pathname = location.pathname;

    // 公開路由（不強制踢出）
    const isPublicPath =
      pathname === "/" ||
      pathname === "/featured" ||
      pathname === "/courses" ||
      pathname.startsWith("/courses/") || // 課程詳情與子頁都視為公開（若要鎖，移到受保護判斷）
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/search";

    if (isPublicPath) {
      // 在公開頁面：若已登入，排一次自動登出；未登入就不處理
      if (!isTokenExpired()) {
        scheduleAutoLogout();
      }
      return;
    }

    // 受保護頁面（例如 /my-courses）
    if (isTokenExpired()) {
      logout();
    } else {
      scheduleAutoLogout();
    }
  }, [location.pathname]);

  return (
    <>
      {/* 背景圖層 */}
      <div
        className="page-background"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundImage: "url('/background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          zIndex: -1,
        }}
      />
      {/* 主體內容 */}
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

            {/* 課程主頁（播放器＋章節清單） */}
            <Route path="/courses/:id" element={<CoursesDetail />} />

            {/* 分拆的子頁（資訊 / 進度 / 教材 / 題目 / 討論 / 留言） */}
            <Route path="/courses/:id/info" element={<CourseInfo />} />
            <Route path="/courses/:id/progress" element={<CourseProgress />} />
            <Route path="/courses/:id/materials" element={<CourseMaterials />} />
            <Route path="/courses/:id/problems" element={<CourseProblems />} />
            <Route path="/courses/:id/discussion" element={<CourseDiscussion />} />
            <Route path="/courses/:id/comments" element={<CourseComments />} />

            {/* 需登入的頁面 */}
            <Route path="/my-courses" element={<MyCourses />} />

            {/* Auth & Search */}
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
