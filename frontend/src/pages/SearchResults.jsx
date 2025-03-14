// src/pages/SearchResults.jsx
import React from "react";
import { useLocation } from "react-router-dom";

function SearchResults() {
  const location = useLocation();
  // 解析 URL 查詢字串 /search?query=XXX
  const params = new URLSearchParams(location.search);
  const query = params.get("query");

  return (
    <div style={{ padding: "20px" }}>
      <h2>搜尋結果</h2>
      <p>關鍵字：{query}</p>
      {/* 你可以在這裡呼叫後端 API 或過濾課程清單 */}
    </div>
  );
}

export default SearchResults;
