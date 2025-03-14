import React from "react";
import "./SearchBar.css"; // 引入 CSS 檔案

const SearchBar = () => {
  return (
    <div className="search-container">
      {/* 搜尋圖示 */}
      <span className="search-icon">🔍</span>

      {/* 輸入框 */}
      <input
        type="text"
        placeholder="搜尋"
        className="search-input"
      />

      {/* 按鈕 */}
      <button className="search-button">搜尋</button>
    </div>
  );
};

export default SearchBar;
