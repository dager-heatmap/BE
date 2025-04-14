// cacheCoords.js
const fs = require("fs");
const path = require("path");
const getCoordsFromAddress = require("./services/geocode");
const getRouteCoords = require("./services/getRouteCoords");

const inputPath = path.join(__dirname, "data", "danger.json");
const outputPath = path.join(__dirname, "data", "danger_zones_cache.json");

async function main() {
  const raw = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  const result = [];

  for (const item of raw) {
    const base = `${item.시도} ${item.시군구}`;
    const startAddress = item["시작구간(주소)"] ? `${base} ${item["시작구간(주소)"]}` : null;
    const endAddress = `${base} ${item["끝구간(주소)"]}`;
    const reason = item["선정사유"];
    const length = item["연장(m)"];

    try {
      if (startAddress) {
        const start = await getCoordsFromAddress(startAddress);
        const end = await getCoordsFromAddress(endAddress);

        if (start && end) {
          const path = await getRouteCoords(start, end); // 도로 경로
          if (path) {
            result.push({
              name: item["연번"],
              type: "polyline",
              coords: [start, end],
              reason: item["선정사유"],
              length: item["연장(m)"],
              address: `${startAddress} ~ ${endAddress}` // ✅ 추가
            });
            
          }
        }
      } else {
        const coord = await getCoordsFromAddress(endAddress);
        if (coord) {
          result.push({
            name: item["연번"],
            type: "point",
            coords: coord,
            reason,
            length
          });
        }
      }
    } catch (e) {
      console.error(`❌ ${item["연번"]} 처리 실패:`, e.message);
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log("✅ danger_zones_cache.json 생성 완료!");
}

main();
