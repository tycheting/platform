// src/pages/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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

      // 顯示成功訊息
      setMsg(res.data.msg || '註冊成功');

      // ✅ 1秒後自動跳轉到登入頁
      setTimeout(() => {
        navigate('/login');
      }, 1000);
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
      {/* LOGO 漂浮在註冊卡片外部上方 */}
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
            placeholder="姓名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
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
