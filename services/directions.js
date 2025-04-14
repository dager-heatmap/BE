// services/directions.js
const axios = require("axios");

const CLIENT_ID = "f0a5l6s8em";
const CLIENT_SECRET = "B88PpCSX8eMEZ6JgfJ5p5tG9dHRNtCnNK1b9W3JP";

async function getRoadPath(startCoords, endCoords) {
  try {
    const res = await axios.post(
      "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving",
      null, {
        params: {
          start: `${startCoords[1]},${startCoords[0]}`,
          goal: `${endCoords[1]},${endCoords[0]}`
        },
        headers: {
          "X-NCP-APIGW-API-KEY-ID": CLIENT_ID,
          "X-NCP-APIGW-API-KEY": CLIENT_SECRET
        }
      }
    );

    const path = res.data.route.traoptimal[0].path; // [[lon, lat], ...]
    return path.map(([lng, lat]) => [lat, lng]);
  } catch (e) {
    console.error("❌ 경로 요청 실패:", e.response?.data || e.message);
    return null;
  }
}

module.exports = getRoadPath;
