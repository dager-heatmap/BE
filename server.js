const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const getCoordsFromAddress = require("./services/geocode");
const getRoadPath = require("./services/directions");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ 정적 파일 제공 (optional)
app.use(express.static("public"));

// ✅ 데이터 불러오기
const rawData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "danger_zones_cache.json"), "utf-8")
);

// ✅ 메인 API
app.get("/api/danger-zones", async (req, res) => {
  res.json(rawData);
});

// ✅ 검색 API
app.get("/api/danger-zones/search", async (req, res) => {
  const query = (req.query.q || "").trim();
  if (!query) return res.json([]);

  const filtered = rawData.filter(item =>
    [item["시작구간(주소)"], item["끝구간(주소)"], item["선정사유"]]
      .filter(Boolean).join(" ")
      .includes(query)
  );

  res.json(filtered);
});

// ✅ 기본 페이지
app.get("/", (req, res) => {
  res.send("서울 위험지도 API 서버가 실행 중입니다.");
});

// ✅ 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행됨: http://localhost:${PORT}`);
});
