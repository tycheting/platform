// src/pages/Register.js
import React, { useState } from 'react';
import { Container, Form, Button } from 'react-bootstrap';
import axios from 'axios';
import './Register.css';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        email,
        password,
        name
      });
      setMsg(res.data.msg);
    } catch (error) {
      if (error.response) {
        setMsg(error.response.data.msg || '註冊失敗');
      } else {
        setMsg('註冊失敗(伺服器無回應)');
      }
    }
  };

  return (
    <Container style={{ maxWidth: '400px', marginTop: '2rem' }}>
      <h2>註冊</h2>
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

        <Form.Group className="mb-3" controlId="formName">
          <Form.Label>姓名</Form.Label>
          <Form.Control 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="輸入姓名" 
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          註冊
        </Button>
      </Form>
      {msg && <p className="mt-3">{msg}</p>}
    </Container>
  );
}

export default Register;
