// src/pages/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { saveAuth } from '../auth'; // ⬅ 新增：用統一的保存流程
import './Register.css';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/auth/register', {
        email,
        password,
        name
      });

      const token = res.data.token;

      // ✅ 用 auth.js 統一保存（含 userName、exp、以及自動登出排程）
      saveAuth(token);

      // ✅ 註冊後直接導向 /my-courses
      navigate("/my-courses");
    } catch (error) {
      if (error.response && typeof error.response.data === 'string') {
        setMsg(error.response.data);
      } else {
        setMsg('註冊失敗（伺服器無回應）');
      }
    }
  };

  return (
    <div
      className="register-page"
      style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/background.png)` }}
    >
      <img
        src={`${process.env.PUBLIC_URL}/logo2.png`}
        alt="Logo"
        className="register-float-logo"
      />

      <div className="register-card">
        <h2 className="register-title">註冊</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="用戶 ID"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            pattern="[A-Za-z\s]+"
            title="姓名只能輸入英文（A-Z 與空格）"
          />
          <input
            type="email"
            placeholder="信箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="密碼"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">註冊</button>
          {msg && <p className="register-msg">{msg}</p>}
        </form>

        <p className="login-text">
          已經有帳號了？{' '}
          <span className="login-link" onClick={() => navigate('/login')}>
            登入
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;
