// src/pages/Courses.js
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Courses.css';

function Courses() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/courses');
      setCourses(res.data);
    } catch (error) {
      console.error('取得課程失敗: ', error);
    }
  };

  return (
    <Container className="mt-4">
      <h2>課程列表</h2>
      <Row>
        {courses.map(course => (
          <Col key={course.id} md={4} className="mb-4">
            {/* 以 <Link> 包裹整個 Card，並移除「查看詳情」按鈕。 */}
            <Link 
              to={`/courses/${course.id}`} 
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Card className="h-100">
                {course.image_path && (
                  <Card.Img 
                    variant="top" 
                    src={course.image_path} 
                    alt={course.title}
                    style={{ height: "180px", objectFit: "cover" }} // 讓圖片固定大小
                  />
                )}
                <Card.Body>
                  <Card.Title>{course.title}</Card.Title>
                  <Card.Text>
                    {course.description?.slice(0, 60)}...
                  </Card.Text>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default Courses;
