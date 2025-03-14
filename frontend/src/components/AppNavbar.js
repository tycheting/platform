import React from "react";
import { Navbar, Nav } from "react-bootstrap";
import { Link } from "react-router-dom";
import SearchBar from "./SearchBar"; // 引入搜尋欄元件

function AppNavbar() {
  return (
    <Navbar bg="light" expand="lg" className="py-2">
      {/* 左側品牌名稱 / Logo */}
      <Navbar.Brand as={Link} to="/">線上課程平台</Navbar.Brand>

      {/* 小螢幕時的漢堡選單按鈕 */}
      <Navbar.Toggle aria-controls="basic-navbar-nav" />

      {/* 導覽內容區 */}
      <Navbar.Collapse id="basic-navbar-nav" className="justify-content-between">
        
        {/* 搜尋欄（已獨立為元件） */}
        <SearchBar />

        {/* 右側：登入、註冊 */}
        <Nav>
          <Nav.Link as={Link} to="/login">登入</Nav.Link>
          <Nav.Link as={Link} to="/register">註冊</Nav.Link>
        </Nav>

      </Navbar.Collapse>
    </Navbar>
  );
}

export default AppNavbar;
