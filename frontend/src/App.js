import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

// 引入自訂元件 (導覽列 & 頁尾)
import AppNavbar from './components/AppNavbar';
import Footer from './components/Footer';

// 引入各個頁面
import Home from './pages/Home';
import Courses from './pages/Courses';
import CoursesDetail from './pages/CoursesDetail';
import Login from './pages/Login';
import Register from './pages/Register';

// 新增搜尋結果頁面
import SearchResults from './pages/SearchResults';

function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <AppNavbar />

        {/* 這個區域會填滿剩餘空間 */}
        <div className="main-content flex-grow-1">
          <Routes>
            <Route path="/" element={<Courses />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CoursesDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* 新增搜尋結果路由 */}
            <Route path="/search" element={<SearchResults />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
