import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./SearchBar.css";
import { FaSearch, FaMicrophone } from "react-icons/fa";
import { FaStar, FaRegStar, FaStarOfLife } from "react-icons/fa";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [hasCleared, setHasCleared] = useState(false); 
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("query");
    if (query) {
      setSearchTerm(query);
      setIsActive(true);
    }
  }, [location.search]);

  const handleFocus = () => {
    if (!hasCleared) {
      setSearchTerm("");
      setHasCleared(true);
      setIsActive(false);
    }
  };

  const handleSubmit = (e) => {
  e.preventDefault();
  if (!searchTerm.trim()) return;

  navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
  inputRef.current.blur();
  setHasCleared(false);
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
      onClick={() => inputRef.current?.focus()}
    >
      <FaSearch className="search-icon" />
      <input
        ref={inputRef}
        className="search-input"
        type="text"
        placeholder="搜尋課程、主題、關鍵字"
        value={searchTerm}
        onChange={handleChange}
        onFocus={handleFocus}
      />
      <button type="submit" className="search-button" title="搜尋">
        ✦
      </button>
    </form>
  );
};

export default SearchBar;
