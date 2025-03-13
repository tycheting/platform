import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function CourseDetail() {
    const { id } = useParams();
    const [course, setCourse] = useState(null);

    useEffect(() => {
        console.log("請求 API:", `http://localhost:5000/courses/${id}`);
    
        axios.get(`http://localhost:5000/courses/${id}`)
            .then(response => {
                console.log("API 回應資料:", response.data);
                setCourse(response.data);
            })
            .catch(error => {
                console.error("獲取課程失敗:", error);
            });
      }, [id]);

    if (!course) return <p>載入中...</p>;

    return (
        <div>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
          <p>{course.category}</p>

          {/* 顯示影片 */}
          {course.video_path && (
                <video width="640" height="360" controls>
                    <source src={course.video_path} type="video/mp4" />
                    您的瀏覽器不支援 HTML5 影片標籤。
                </video>
            )}
        </div>
    );
}

export default CourseDetail;