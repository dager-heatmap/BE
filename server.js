const sinkholeRouter = require('./sinkhole_data.js');
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const getRouteCoords = require("./services/getRouteCoords"); // 도로 경로 불러오는 함수


const app = express();
app.use(cors());
app.use(express.json());
app.use('/', sinkholeRouter);

// ✅ 정적 파일 제공
app.use(express.static("public"));

// ✅ 캐시된 데이터 로드
const rawData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "danger_zones_coord.json"), "utf-8")
);

// ✅ 위험지역 전체 조회 API
app.get("/api/danger-zones", async (req, res) => {
  const results = [];

  for (const zone of rawData) {
    const { name, type, coords, reason, length, address } = zone;

    if (type === "polyline" && coords.length === 2) {
      const [start, end] = coords;

      try {
        const route = await getRouteCoords(start, end);
        results.push({
          name,
          type,
          coords: route && route.length > 0 ? route : [start, end],  // ✅ fallback
          reason,
          length,
          address
        });
      } catch (e) {
        console.warn(`❌ 경로 요청 실패 (zone ${name}): ${e.message}`);
        results.push({
          name,
          type,
          coords: [start, end],
          reason,
          length,
          address
        });
      }

    } else {
      results.push(zone); // point는 그대로
    }
  }

  res.json(results); // ✅ 한 번만 응답
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

