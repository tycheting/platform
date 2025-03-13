// src/pages/Login.js
import React, { useState } from 'react';
import { Container, Form, Button } from 'react-bootstrap';
import axios from 'axios';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      setMsg(res.data.msg);
      // TODO: 儲存登入資訊 (例如: token, user data) 到 localStorage 或 Context
    } catch (error) {
      if (error.response) {
        setMsg(error.response.data.msg || '登入失敗');
      } else {
        setMsg('登入失敗(伺服器無回應)');
      }
    }
  };

  return (
    <Container style={{ maxWidth: '400px', marginTop: '2rem' }}>
      <h2>登入</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="輸入 Email" 
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formPassword">
          <Form.Label>密碼</Form.Label>
          <Form.Control 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="輸入密碼" 
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          登入
        </Button>
      </Form>
      {msg && <p className="mt-3">{msg}</p>}
    </Container>
  );
}

export default Login;
