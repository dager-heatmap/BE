const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const getCoordsFromAddress = require("./services/geocode");
const getRoadPath = require("./services/directions");

const app = express();

// ✅ CORS 설정
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options("*", cors()); // preflight 응답

// ✅ 캐싱된 데이터 로드
const rawData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "danger_zones_cache.json"), "utf-8")
);

// ✅ 위험지역 전체 API
app.get("/api/danger-zones", async (req, res) => {
  const zones = [];

  for (const item of rawData) {
    const base = `${item.시도} ${item.시군구}`;
    const startAddress = item["시작구간(주소)"] ? `${base} ${item["시작구간(주소)"]}` : null;
    const endAddress = `${base} ${item["끝구간(주소)"]}`;

    try {
      if (startAddress) {
        const start = await getCoordsFromAddress(startAddress);
        const end = await getCoordsFromAddress(endAddress);

        if (start && end) {
          const path = await getRoadPath(start, end);
          if (path) {
            zones.push({
              name: item["연번"],
              type: "polyline",
              coords: path,
              reason: item["선정사유"],
              length: item["연장(m)"]
            });
          }
        }
      } else {
        const coord = await getCoordsFromAddress(endAddress);
        if (coord) {
          zones.push({
            name: item["연번"],
            type: "point",
            coords: coord,
            reason: item["선정사유"],
            length: item["연장(m)"]
          });
        }
      }
    } catch (e) {
      console.error(`❌ [${item["연번"]}] 처리 실패: ${e.message}`);
    }
  }

  res.json(zones);
});

// ✅ 위험지역 검색 API
app.get("/api/danger-zones/search", async (req, res) => {
  const query = (req.query.q || "").trim();
  if (!query) return res.json([]);

  const results = [];

  for (const item of rawData) {
    const combined = [
      item["시작구간(주소)"],
      item["끝구간(주소)"],
      item["선정사유"]
    ].filter(Boolean).join(" ");

    if (!combined.includes(query)) continue;

    const base = `${item.시도} ${item.시군구}`;
    const startAddress = item["시작구간(주소)"] ? `${base} ${item["시작구간(주소)"]}` : null;
    const endAddress = `${base} ${item["끝구간(주소)"]}`;

    try {
      if (startAddress) {
        const start = await getCoordsFromAddress(startAddress);
        const end = await getCoordsFromAddress(endAddress);
        const path = await getRoadPath(start, end);
        if (path) {
          results.push({
            name: item["연번"],
            type: "polyline",
            coords: path,
            reason: item["선정사유"],
            length: item["연장(m)"]
          });
        }
      } else {
        const coord = await getCoordsFromAddress(endAddress);
        if (coord) {
          results.push({
            name: item["연번"],
            type: "point",
            coords: coord,
            reason: item["선정사유"],
            length: item["연장(m)"]
          });
        }
      }
    } catch (e) {
      console.warn(`❌ 검색 중 오류 (${item["연번"]}): ${e.message}`);
    }
  }

  res.json(results);
});

// ✅ 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행됨: http://localhost:${PORT}/api/danger-zones`);
});
