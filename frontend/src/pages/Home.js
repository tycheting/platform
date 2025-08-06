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

  // 定義區塊順序與每個要顯示幾個課程
  const sections = [
    { title: '你會喜歡', key: 'recommend', count: 8 },
    { title: '現在熱門', key: 'hot', count: 8 },
    { title: '新興趨勢', key: 'trend', count: 8 },
  ];

  // 計算每區塊對應的起始 index
  const getCoursesSlice = (startIdx, count) => courses.slice(startIdx, startIdx + count);

  return (
    <Container className="mt-4">
      {sections.map((section, idx) => {
        // 每區塊切取課程（可依後端分類後調整為 filter）
        const startIndex = idx === 0 ? 0 : sections.slice(0, idx).reduce((sum, s) => sum + s.count, 0);
        const courseList = getCoursesSlice(startIndex, section.count);

        return (
          <div key={section.key} className="course-section mb-5">
            <div className="title-with-lines mb-3">
              <div className="title-image-wrapper">
                <img
                  src={`/${section.key}.png`}
                  alt={section.title}
                  className="featured-title-image"
                />
              </div>
            </div>
            <Row>
              {courseList.map(course => (
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
        );
      })}
    </Container>
  );
}

export default Courses;
