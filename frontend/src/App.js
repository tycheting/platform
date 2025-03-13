import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    // 向後端 (localhost:5000) 取得資料
    axios.get('http://localhost:5000/')
      .then((res) => {
        setMessage(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  return (
    <div style={{ margin: '20px' }}>
      <h1>React 與 Express 測試</h1>
      <p>後端回傳: {message}</p>
    </div>
  );
}

export default App;