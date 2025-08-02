// src/pages/SearchResults.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

function SearchResults() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const query = params.get("query");

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query && query.trim() !== "") {
      axios
        .get(`http://localhost:5000/search?query=${encodeURIComponent(query)}`)
        .then((res) => {
          setResults(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("搜尋失敗：", err);
          setLoading(false);
        });
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [query]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>搜尋結果</h2>
      <p>關鍵字：{query}</p>

      {loading ? (
        <p>載入中...</p>
      ) : results.length === 0 ? (
        <p>找不到符合的課程</p>
      ) : (
        <ul>
          {results.map((course) => (
            <li key={course.id} style={{ marginBottom: "20px" }}>
              <h4>{course.title}</h4>
              <p>{course.description}</p>
              {course.image_path && (
                <img
                  src={course.image_path}
                  alt={course.title}
                  style={{ width: "200px", borderRadius: "8px" }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchResults;
