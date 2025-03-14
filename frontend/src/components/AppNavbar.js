import React from 'react';
import {
  Navbar,
  Nav,
  Form,
  FormControl,
  Button,
  InputGroup
} from 'react-bootstrap';
import { Link } from 'react-router-dom';

function AppNavbar() {
  return (
    <Navbar bg="light" expand="lg" className="py-2">
      {/* 品牌名稱 / Logo */}
      <Navbar.Brand as={Link} to="/">
        線上課程平台
      </Navbar.Brand>

      {/* 漢堡選單（小螢幕） */}
      <Navbar.Toggle aria-controls="basic-navbar-nav" />

      {/* 主要導覽內容 */}
      <Navbar.Collapse id="basic-navbar-nav">
        {/* 左側連結 */}
        <Nav className="me-auto">
          <Nav.Link as={Link} to="/">首頁</Nav.Link>
          <Nav.Link as={Link} to="/courses">課程</Nav.Link>
        </Nav>

        {/* 中間搜尋欄 - 使用 InputGroup 融合按鈕 */}
        <Form className="d-flex mx-auto" style={{ maxWidth: '300px' }}>
          <InputGroup className="rounded-pill overflow-hidden">
            <FormControl
              placeholder="搜尋課程"
              aria-label="搜尋課程"
              className="border-0"
            />
            <Button variant="success" className="border-0">
              搜尋
            </Button>
          </InputGroup>
        </Form>

        {/* 右側登入、註冊 */}
        <Nav className="ms-auto">
          <Nav.Link as={Link} to="/login">登入</Nav.Link>
          <Nav.Link as={Link} to="/register">註冊</Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
}

export default AppNavbar;
