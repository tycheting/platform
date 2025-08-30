// src/pages/Login.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { isTokenExpired, logout, saveAuth, scheduleAutoLogout } from '../auth'; // ⬅ 新增
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  // 進入登入頁時，若已有未過期 token 就直接帶去 /my-courses
  useEffect(() => {
    if (!isTokenExpired()) {
      scheduleAutoLogout();
      navigate('/my-courses');
    } else {
      // 確保清掉殘留的過期資訊
      logout(); // 本頁就是 /login，不影響導頁
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/auth/login', {
        email,
        password
      });

      const token = res.data.token;

      // ✅ 使用統一的保存流程（含 userName、exp、排程自動登出）
      saveAuth(token);

      navigate("/my-courses");
    } catch (error) {
      if (error.response && typeof error.response.data === 'string') {
        setMsg(error.response.data);
      } else {
        setMsg('登入失敗（伺服器無回應）');
      }
    }
  };

  return (
    <div
      className="login-page"
      style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/background.png)` }}
    >
      <img
        src={`${process.env.PUBLIC_URL}/logo2.png`}
        alt="Logo"
        className="login-float-logo"
      />

      <div className="login-card">
        <h2 className="login-title">登入</h2>
        <form onSubmit={handleSubmit}>
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
          <button type="submit">登入</button>
          {msg && <p className="login-msg">{msg}</p>}
        </form>

        <p className="register-text">
          還沒有帳號？{' '}
          <span className="register-link" onClick={() => navigate('/register')}>
            註冊
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
