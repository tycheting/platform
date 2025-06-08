import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./SearchBar.css";
import { FaSearch, FaMicrophone } from "react-icons/fa";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isActive, setIsActive] = useState(false);
  const inputRef = useRef(null); // ⭐ 取得輸入框的 DOM
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
    setSearchTerm("");
    setIsActive(false);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsActive(value.trim().length > 0);
  };

  return (
    <form
      className={`search-container ${isActive ? "active" : ""}`}
      onSubmit={handleSubmit}
      onClick={() => inputRef.current?.focus()} // 點整個表單聚焦輸入框
    >
      <FaSearch className="search-icon" />
      <input
        ref={inputRef} // 綁定 ref
        className="search-input"
        type="text"
        placeholder="搜尋課程、主題、老師"
        value={searchTerm}
        onChange={handleChange}
      />
      <button type="submit" className="search-button" title="搜尋">
        <FaMicrophone />
      </button>
    </form>
  );
};

export default SearchBar;
