// cacheRoutes.js
const fs = require("fs");
const axios = require("axios");

const CLIENT_ID = "f0a5l6s8em";
const CLIENT_SECRET = "B88PpCSX8eMEZ6JgfJ5p5tG9dHRNtCnNK1b9W3JP";
const input = "./data/danger_zones_cache.json";
const output = "./data/danger_zones_with_routes.json";

async function getRouteCoords(start, end) {
  try {
    const res = await axios.post(
      "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving",
      null,
      {
        params: {
          start: `${start[1]},${start[0]}`,
          goal: `${end[1]},${end[0]}`,
          option: "trafast",
        },
        headers: {
          "X-NCP-APIGW-API-KEY-ID": CLIENT_ID,
          "X-NCP-APIGW-API-KEY": CLIENT_SECRET,
        },
      }
    );

    const path = res.data.route.trafast[0].path;
    return path.map(([lng, lat]) => [lat, lng]);
  } catch (e) {
    console.error("❌ 경로 오류:", e?.response?.data || e.message);
    return null;
  }
}

(async () => {
  const rawData = JSON.parse(fs.readFileSync(input, "utf-8"));
  const result = [];

  for (const zone of rawData) {
    if (zone.type === "polyline" && zone.coords?.length === 2) {
      const route = await getRouteCoords(zone.coords[0], zone.coords[1]);
      if (route) {
        zone.coords = route;
      }
    }
    result.push(zone);
  }

  fs.writeFileSync(output, JSON.stringify(result, null, 2));
  console.log(`✅ 저장 완료: ${output}`);
})();
