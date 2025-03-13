import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <AppNavbar /> {/* 導覽列 (Navbar) */}
      
      <div className="container mt-4"> {/* Bootstrap 的 Container */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CoursesDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>

      <Footer /> {/* 頁尾 (Footer) */}
    </Router>
  );
}

export default App;
