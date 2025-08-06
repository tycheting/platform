import React, { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import axios from 'axios';
import { Link } from 'react-router-dom';
import WhiteBox from '../components/WhiteBox';
import './Courses.css';

function Courses() {
  const [courses, setCourses] = useState([]);
  const [activeCategory, setActiveCategory] = useState('語言');

  // key：資料庫中的分類名稱 / label：顯示在畫面上的字
  const categories = [
    { key: '語言', label: '語言人文' },
    { key: '音樂', label: '音樂美學' },
    { key: '攝影', label: '影像創作' },
    { key: '藝術', label: '藝術設計' },
    { key: '程式', label: '資訊工程' },
    { key: '科學', label: '數理科學' },
    { key: '商管', label: '商業管理' },
    { key: '教育', label: '教育學習' },
    { key: '生活', label: '生活應用' },
    { key: '運動', label: '運動健康' },
  ];

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
      <WhiteBox className="white-box">
        <div className="category-bar">
          {categories.map(({ key, label }) => (
            <span
              key={key}
              className={`category-item ${activeCategory === key ? 'active' : ''}`}
              onClick={() => setActiveCategory(key)}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="search-result-list">
          {courses
            .filter(course => course.category === activeCategory)
            .map(course => (
              <Link
                to={`/courses/${course.id}`}
                className="search-result-item"
                key={course.id}
              >
                <div className="result-image-wrapper">
                  <img
                    src={course.image_path}
                    alt={course.title}
                    className="result-image"
                  />
                </div>
                <div className="result-content">
                  <h4 className="result-title">{course.title}</h4>
                  <p className="result-description">{course.description}</p>
                </div>
              </Link>
            ))}
        </div>
      </WhiteBox>
    </Container>
  );
}

export default Courses;
