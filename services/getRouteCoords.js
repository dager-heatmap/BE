const axios = require("axios");

const CLIENT_ID = "f0a5l6s8em";
const CLIENT_SECRET = "B88PpCSX8eMEZ6JgfJ5p5tG9dHRNtCnNK1b9W3JP";

async function getRouteCoords(start, end) {
  try {
    const res = await axios.post(
      "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving",
      null,
      {
        params: {
          start: `${start[1]},${start[0]}`,
          goal: `${end[1]},${end[0]}`,
          option: "trafast"
        },
        headers: {
          "X-NCP-APIGW-API-KEY-ID": CLIENT_ID,
          "X-NCP-APIGW-API-KEY": CLIENT_SECRET
        }
      }
    );

    const path = res.data.route.trafast[0].path;
    return path.map(([lng, lat]) => [lat, lng]);
  } catch (e) {
    //console.error("🚨 도로 경로 요청 실패:", e.response?.data || e.message);
    return null;
  }
}

module.exports = getRouteCoords;
