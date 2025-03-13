// src/pages/Courses.js
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
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
      const res = await axios.get('http://localhost:5000/api/courses');
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
            <Card>
              <Card.Body>
                <Card.Title>{course.title}</Card.Title>
                <Card.Text>
                  {course.description?.slice(0, 60)}...
                </Card.Text>
                <Button 
                  as={Link} 
                  to={`/courses/${course.id}`} 
                  variant="primary"
                >
                  查看詳情
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default Courses;
