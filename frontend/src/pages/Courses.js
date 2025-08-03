import React, { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { Link } from 'react-router-dom';
import WhiteBox from '../components/WhiteBox';
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
      <WhiteBox>
        <Row>
          {courses.map(course => (
            <Col key={course.id} xs={12} sm={6} md={4} lg={4} className="mb-4">
              <Link to={`/courses/${course.id}`} className="course-link">
                <div className="course-image-container">
                  <img 
                    src={course.image_path} 
                    alt={course.title} 
                    className="course-image"
                  />
                </div>
                <h5 className="course-title">{course.title}</h5>
              </Link>
            </Col>
          ))}
        </Row>
      </WhiteBox>
    </Container>
  );
}

export default Courses;
