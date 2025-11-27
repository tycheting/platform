import React, { useEffect, useState, useRef } from 'react';
import { Container } from 'react-bootstrap';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Home.css';

function Courses() {
  const [courses, setCourses] = useState([]);
  
  // 1. 建立 Ref 來控制上下兩排不同的捲動區塊
  const row1Ref = useRef(null);
  const row2Ref = useRef(null);

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

  // 分割課程資料
  const midIndex = Math.ceil(courses.length / 2);
  const row1Courses = courses.slice(0, midIndex);
  const row2Courses = courses.slice(midIndex);

  // 2. 左右滑動功能的函式
  const scroll = (ref, scrollOffset) => {
    if (ref.current) {
      // smooth 代表平滑捲動
      ref.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  // 3. 定義一個渲染「滑動區塊」的元件
  const renderSliderRow = (items, ref) => (
    <div className="slider-container mb-5">
      
      {/* 左按鈕 */}
      <button className="nav-btn left-btn" onClick={() => scroll(ref, -600)}>
        {/* 這是一個向左的箭頭符號，您也可以換成圖片 */}
        ◀ 
      </button>

      {/* 捲動軌道 (綁定 ref) */}
      <div className="slider-track" ref={ref}>
        {items.map(course => (
          <Link to={`/courses/${course.id}`} className="course-card-scroll" key={course.id}>
            <div className="course-image-container">
              <img src={course.image_path} alt={course.title} className="course-image" />
            </div>
            <h5 className="course-title">{course.title}</h5>
          </Link>
        ))}
      </div>

      {/* 右按鈕 */}
      <button className="nav-btn right-btn" onClick={() => scroll(ref, 600)}>
        ▶
      </button>

    </div>
  );

  return (
    <Container fluid className="mt-4 p-0">
      <div className="banner-wrapper mb-5">
        <img src="/banner.png" alt="Welcome Banner" className="main-banner" />
      </div>

      {/* 渲染兩排手動滑動列表 */}
      {row1Courses.length > 0 && renderSliderRow(row1Courses, row1Ref)}
      {row2Courses.length > 0 && renderSliderRow(row2Courses, row2Ref)}

    </Container>
  );
}

export default Courses;