import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './AppNavbar.css';

function AppNavbar() {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">線上課程平台</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">首頁</Nav.Link>
            <Nav.Link as={Link} to="/courses">課程列表</Nav.Link>
          </Nav>
          <Nav>
            <Button as={Link} to="/login" className="me-3 custom-login-btn">
              登入
            </Button>
            <Button as={Link} to="/register" className="custom-register-btn">
              註冊
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;
