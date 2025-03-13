import React from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import styles from "./AppNavbar.module.css";

function AppNavbar() {
  return (
    <Navbar expand="lg" className={styles.navbarCustom}>
      <Container>
        {/* Logo */}
        <Navbar.Brand as={Link} to="/" className={styles.brand}>
          線上課程<span>平台</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {/* 選單項目 */}
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" className={`${styles.navItem} ${styles.navItemActive}`}>
              首頁
            </Nav.Link>
            <Nav.Link as={Link} to="/courses" className={styles.navItem}>
              課程列表
            </Nav.Link>
          </Nav>

          {/* 右側按鈕 */}
          <Nav className={styles.buttonGroup}>
            <Button as={Link} to="/search" className={styles.searchButton}>
              🔍 Search
            </Button>
            <Button as={Link} to="/register" className={styles.registerButton}>
              註冊
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;
