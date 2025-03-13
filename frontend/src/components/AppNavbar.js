import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function AppNavbar() {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">我的線上課程平台</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">首頁</Nav.Link>
            <Nav.Link as={Link} to="/courses">課程列表</Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link as={Link} to="/login">登入</Nav.Link>
            <Nav.Link as={Link} to="/register">註冊</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;
