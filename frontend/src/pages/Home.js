import React, { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Home.css';

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

  const sections = [
    { title: '現在熱門', key: 'hot' },
    { title: '你會喜歡', key: 'recommend' },
    { title: '新興趨勢', key: 'trend' },
  ];

  return (
    <Container className="mt-4">
      {sections.map((section, idx) => (
        <div key={section.key} className="course-section">
          <div className="title-with-lines">
            <div className="title-image-wrapper">
              <img
                src={`/${section.key}.png`}
                alt={section.title}
                className="featured-title-image"
              />
            </div>
          </div>
          <Row>
            {courses.slice(idx * 4, idx * 4 + 4).map(course => (
              <Col key={course.id} xs={12} sm={6} md={3} className="mb-3">
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
        </div>
      ))}
    </Container>
  );
}

export default Courses;