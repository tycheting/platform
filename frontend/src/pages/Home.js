// src/pages/Home.js
import React from 'react';
import { Container, Jumbotron, Button } from 'react-bootstrap';

function Home() {
  return (
    <Container className="mt-4">
      {/* Jumbotron在Bootstrap 5沒有了，可以改成以下樣式 */}
      <div className="p-5 mb-4 bg-light rounded-3">
        <h1>歡迎來到線上課程平台</h1>
        <p>在這裡，你可以發現各種專業領域的課程，隨時隨地學習！</p>
        <Button variant="primary" href="/courses">前往課程列表</Button>
      </div>
    </Container>
  );
}

export default Home;
