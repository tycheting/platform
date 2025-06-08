import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

import AppNavbar from './components/AppNavbar';
import Footer from './components/Footer';
import SearchBar from './components/SearchBar'; // ← 加這行

import Home from './pages/Home';
import Courses from './pages/Courses';
import CoursesDetail from './pages/CoursesDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import SearchResults from './pages/SearchResults';

function AppContent() {
  const location = useLocation();
  const hideSearchBar = ["/login", "/register"].includes(location.pathname);

  return (
    <>
      {/* 背景圖層 */}
      <div className="page-background" style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        backgroundImage: "url('/background.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        zIndex: -1,
      }}></div>

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
            <Route path="/" element={<Courses />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CoursesDetail />} />
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

// 外層包 Router
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
