// src/pages/Featured.js
import React, { useState } from 'react';

function Featured() {
  const [username, setUsername] = useState('');
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendRequest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
        },
        body: JSON.stringify({ username }),
      });

      if (!res.ok) throw new Error('請求失敗');
      const data = await res.json();
      setRecommendations(data);
    } catch (err) {
      setError('取得推薦課程時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4">推薦課程</h2>
      <p>這裡會顯示平台精選的熱門課程。</p>

      <div className="mb-3">
        <input
          type="text"
          placeholder="輸入使用者 ID"
          className="form-control"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button className="btn btn-primary mt-2" onClick={sendRequest}>
          取得推薦課程
        </button>
      </div>

      {loading && <p>載入中...</p>}
      {error && <p className="text-danger">{error}</p>}

      {recommendations && (
        <div className="mt-4">
          <h4>推薦結果</h4>
          <pre>{JSON.stringify(recommendations, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default Featured;
