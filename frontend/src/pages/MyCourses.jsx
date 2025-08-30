import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import WhiteBox from '../components/WhiteBox';
import './MyCourses.css';

function MyCourses() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios.get("http://localhost:5000/user/my-courses", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      const uniqueCourses = Array.from(
        new Map(res.data.map(course => [course.course_id, course])).values()
      );
      setCourses(uniqueCourses);
    })
    .catch(() => setCourses([]));
  }, []);

  // ✅ 圖片路徑處理：補上完整網址
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/images')) {
      return `http://localhost:5000${imagePath}`;
    }
    return `http://localhost:5000/images/${imagePath}`;
  };

  return (
    <Container className="mt-4 mycourses-page">
      <WhiteBox className="white-box">
        <div className="title-with-lines">
          <img src="/已選課程.png" alt="我的課程" className="title-image" />
        </div>

        <div className="search-result-list">
          {courses.map(course => (
            <Link
              to={`/courses/${course.course_id}`}
              className="search-result-item"
              key={course.course_id}
            >
              <div className="result-image-wrapper">
                <img
                  src={getImageUrl(course.image_path)}
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

export default MyCourses;
