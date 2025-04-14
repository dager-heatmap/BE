const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const getCoordsFromAddress = require("./services/geocode");
const getRouteCoords = require("./services/getRouteCoords");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ 정적 파일 제공
app.use(express.static("public"));

// ✅ 데이터 로딩
const rawData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "danger_zones_cache.json"), "utf-8")
);

// ✅ 위험구간 API
app.get("/api/danger-zones", async (req, res) => {
  const results = [];

  for (const zone of rawData) {
    const base = `${zone.시도} ${zone.시군구}`;
    const start = zone["시작구간(주소)"];
    const end = zone["끝구간(주소)"];
    const reason = zone["선정사유"];
    const length = zone["연장(m)"];

    if (start && end) {
      const route = await getRouteCoords(`${base} ${start}`, `${base} ${end}`);
      if (route) {
        results.push({
          type: "polyline",
          coords: route,
          reason,
          length
        });
      }
    } else if (end) {
      const coord = await getCoordsFromAddress(`${base} ${end}`);
      if (coord) {
        results.push({
          type: "point",
          coords: coord,
          reason,
          length
        });
      }
    }
  }

  res.json(results);
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

// ✅ 기본 라우터
app.get("/", (req, res) => {
  res.send("서울 위험지도 API 서버가 실행 중입니다.");
});

// ✅ 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행됨: http://localhost:${PORT}`);
});
