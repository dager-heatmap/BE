// ✅ cacheCoords.js
const fs = require("fs");
const path = require("path");
const getCoordsFromAddress = require("./services/geocode"); // 네이버 API 기반
const inputPath = path.join(__dirname, "data", "danger.json");
const outputPath = path.join(__dirname, "data", "danger_zones_cache.json");

async function main() {
  const raw = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  const result = [];

  for (const item of raw) {
    const base = `${item.시도} ${item.시군구}`;
    const startAddress = item["시작구간(주소)"] ? `${base} ${item["시작구간(주소)"]}` : null;
    const endAddress = `${base} ${item["끝구간(주소)"]}`;

    console.log(`🔍 변환 중: ${item["연번"]}`);

    try {
      if (startAddress) {
        const start = await getCoordsFromAddress(startAddress);
        const end = await getCoordsFromAddress(endAddress);

        if (start && end) {
          result.push({
            name: item["연번"],
            type: "polyline",
            coords: [start, end],
            reason: item["선정사유"],
            length: item["연장(m)"]
          });
        }
      } else {
        const coord = await getCoordsFromAddress(endAddress);
        if (coord) {
          result.push({
            name: item["연번"],
            type: "point",
            coords: coord,
            reason: item["선정사유"],
            length: item["연장(m)"]
          });
        }
      }
    } catch (err) {
      console.error(`❌ 실패: ${item["연번"]}번 구간`);
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`✅ 저장 완료: ${outputPath}`);
}

main();
