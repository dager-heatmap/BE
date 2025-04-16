const fs = require("fs");
const path = require("path");
const axios = require("axios");

const CLIENT_ID = "f0a5l6s8em";
const CLIENT_SECRET = "B88PpCSX8eMEZ6JgfJ5p5tG9dHRNtCnNK1b9W3JP";

const inputPath = path.join(__dirname, "data", "danger.json");
const outputPath = path.join(__dirname, "data", "danger_zones_coord.json");

async function getCoordsFromAddress(address) {
  try {
    const res = await axios.get("https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode", {
      params: { query: address },
      headers: {
        "X-NCP-APIGW-API-KEY-ID": CLIENT_ID,
        "X-NCP-APIGW-API-KEY": CLIENT_SECRET
      }
    });
    const { addresses } = res.data;
    if (addresses.length > 0) {
      const { x, y } = addresses[0];
      return [parseFloat(y), parseFloat(x)];
    }
    return null;
  } catch (e) {
    console.warn("지오코딩 실패:", address);
    return null;
  }
}

async function getRouteCoords(start, end) {
  try {
    const res = await axios.post("https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving", null, {
      params: {
        start: `${start[1]},${start[0]}`,
        goal: `${end[1]},${end[0]}`,
        option: "trafast"
      },
      headers: {
        "X-NCP-APIGW-API-KEY-ID": CLIENT_ID,
        "X-NCP-APIGW-API-KEY": CLIENT_SECRET
      }
    });

    const path = res.data.route.trafast[0]?.path || [];
    return path.map(([x, y]) => [y, x]);
  } catch (e) {
    console.warn("도로 경로 실패:", e.message);
    return null;
  }
}

async function convert() {
  const raw = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  const results = [];

  for (const zone of raw) {
    const base = `${zone["시도"] || ""} ${zone["시군구"] || ""}`.trim();
    const start = zone["시작구간(주소)"];
    const end = zone["끝구간(주소)"];
    const reason = zone["선정사유"];
    const length = zone["연장(m)"];
    const name = zone["연번"];

    if (start && end) {
      const startFull = `${base} ${start}`.trim();
      const endFull = `${base} ${end}`.trim();
      const startCoord = await getCoordsFromAddress(startFull);
      const endCoord = await getCoordsFromAddress(endFull);

      if (startCoord && endCoord) {
        const route = await getRouteCoords(startCoord, endCoord);

        results.push({
          name,
          type: "polyline",
          coords: route && route.length > 0 ? route : [startCoord, endCoord],
          reason,
          length,
          address: `${startFull} ~ ${endFull}`
        });
      } else {
        console.warn(`주소 좌표 변환 실패: ${startFull} / ${endFull}`);
      }
    } else if (end) {
      const endFull = `${base} ${end}`.trim();
      const coord = await getCoordsFromAddress(endFull);
      if (coord) {
        results.push({
          name,
          type: "point",
          coords: coord,
          reason,
          length,
          address: endFull
        });
      } else {
        console.warn(`주소 좌표 변환 실패 (단일): ${endFull}`);
      }
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");
  console.log("danger_zones_coord.json 생성 완료!");
}

convert();
