import React, { useState } from "react";
import { Form, FormControl, Button, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // 處理表單提交
  const handleSubmit = (e) => {
    e.preventDefault();
    // 這裡可以做各種搜尋邏輯：
    // 1. 導航到 /search?query=搜尋字串
    // 2. 或呼叫某個 API 取得搜尋結果
    navigate(`/search?query=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <Form
      onSubmit={handleSubmit}
      className="d-flex mx-auto"
      style={{ maxWidth: "400px", flex: "1" }}
    >
      <InputGroup className="rounded-pill overflow-hidden w-100">
        <InputGroup.Text className="bg-transparent border-0 ps-3 pe-2">
          🔍
        </InputGroup.Text>

        {/* 文字輸入框，跟 searchTerm 綁定 */}
        <FormControl
          placeholder="搜尋"
          aria-label="搜尋"
          className="border-0"
          style={{
            height: "36px",
            fontSize: "14px",
          }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* 按鈕：提交表單 */}
        <Button
          variant="dark"
          className="border-0"
          style={{
            height: "36px",
            fontSize: "14px",
            padding: "5px 15px",
          }}
          type="submit" // 重要：讓表單submit
        >
          搜尋
        </Button>
      </InputGroup>
    </Form>
  );
};

export default SearchBar;
