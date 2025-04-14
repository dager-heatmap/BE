const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ 정적 파일 제공
app.use(express.static("public"));

// ✅ 캐시된 데이터 로드
const rawData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "danger_zones_cache.json"), "utf-8")
);

// ✅ 위험지역 전체 조회 API
app.get("/api/danger-zones", (req, res) => {
  res.json(rawData); // 🔥 여기서 변환 없이 바로 응답
});

// ✅ 검색 API
app.get("/api/danger-zones/search", (req, res) => {
  const query = (req.query.q || "").trim();
  if (!query) return res.json([]);

  const filtered = rawData.filter(item =>
    [item.reason]
      .filter(Boolean)
      .join(" ")
      .includes(query)
  );

  res.json(filtered);
});

// ✅ 기본 라우터
app.get("/", (req, res) => {
  res.send("서울 위험지도 API 서버가 실행 중입니다.");
});

// ✅ 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행됨: http://localhost:${PORT}`);
});
