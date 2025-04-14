const axios = require("axios");

const CLIENT_ID = "f0a5l6s8em";
const CLIENT_SECRET = "B88PpCSX8eMEZ6JgfJ5p5tG9dHRNtCnNK1b9W3JP";

async function getRouteCoords(start, end) {
  try {
    const url = "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving";
    const res = await axios.get(url, {
      params: {
        start: `${start[1]},${start[0]}`, // 경도, 위도 순서
        goal: `${end[1]},${end[0]}`,
        option: "trafast" // 가장 빠른 길
      },
      headers: {
        "X-NCP-APIGW-API-KEY-ID": CLIENT_ID,
        "X-NCP-APIGW-API-KEY": CLIENT_SECRET
      }
    });

    const route = res.data.route.trafast?.[0]?.path;
    if (!route) {
      console.warn("❌ 경로 없음:", start, "->", end);
      return null;
    }

    // [경도, 위도] -> [위도, 경도]
    return route.map(([lng, lat]) => [lat, lng]);

  } catch (e) {
    console.error("❌ 경로 요청 실패:", e.response?.data || e.message);
    return null;
  }
}

module.exports = getRouteCoords;
