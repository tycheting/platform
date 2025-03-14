import React from "react";
import { Form, FormControl, Button, InputGroup } from "react-bootstrap";

const SearchBar = () => {
  return (
    <Form className="d-flex mx-auto" style={{ maxWidth: "400px", flex: "1" }}>
      <InputGroup className="rounded-pill overflow-hidden w-100">
        {/* 搜尋圖示 */}
        <InputGroup.Text className="bg-transparent border-0 ps-3 pe-2">
          🔍
        </InputGroup.Text>

        {/* 搜尋框 */}
        <FormControl
          placeholder="搜尋"
          aria-label="搜尋"
          className="border-0"
          style={{
            height: "36px", // **縮小高度**
            fontSize: "14px", // **讓文字更精緻**
          }}
        />

        {/* 按鈕 */}
        <Button
          variant="dark"
          className="border-0"
          style={{
            height: "36px", // **按鈕與輸入框高度一致**
            fontSize: "14px",
            padding: "5px 15px", // **縮小內距**
          }}
        >
          搜尋
        </Button>
      </InputGroup>
    </Form>
  );
};

export default SearchBar;
