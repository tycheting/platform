import React from "react";
import { Navbar, Nav, Button } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import styles from './AppNavbar.module.css';
import logo from "./logo.png";

function AppNavbar() {
  const location = useLocation();

  // 判斷目前路由是否符合指定 path
  const isActive = (path) => location.pathname === path;

  return (
    <Navbar expand="lg" className={`shadow-sm ${styles.navbarRoot} ${styles.stickyNavbar}`}>
      <div className="d-flex align-items-center w-100 justify-content-between px-4">

        {/* 左側：Logo */}
        <div style={{ width: "20%" }}>
          <Link to="/" className="d-flex align-items-center text-decoration-none">
            <img src={logo} alt="Logo" className={styles.navbarLogo} />
          </Link>
        </div>

        {/* 中間：選單 */}
        <div className="mx-auto d-flex justify-content-center" style={{ width: "60%" }}>
          <Nav className="gap-4 align-items-center">
            <Nav.Link
              as={Link}
              to="/"
              className={`${styles.navLink} ${isActive("/") ? styles.active : ""}`}
            >
              首頁
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/featured"
              className={`${styles.navLink} ${isActive("/featured") ? styles.active : ""}`}
            >
              ✦ 推薦課程
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/courses"
              className={`${styles.navLink} ${isActive("/courses") ? styles.active : ""}`}
            >
              課程分類
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/my-courses"
              className={`${styles.navLink} ${isActive("/my-courses") ? styles.active : ""}`}
            >
              我的課程
            </Nav.Link>
          </Nav>
        </div>

        {/* 右側：按鈕 */}
        <div className="d-flex justify-content-end gap-2" style={{ width: "20%" }}>
          <Button variant="outline-dark" size="sm" as={Link} to="/login" className={styles.navButton}>
            登入
          </Button>
          <Button variant="dark" size="sm" as={Link} to="/register" className={styles.navButton}>
            註冊
          </Button>
        </div>

      </div>
    </Navbar>
  );
}

export default AppNavbar;
