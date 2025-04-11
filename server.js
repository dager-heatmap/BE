// ✅ server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const getCoordsFromAddress = require("./services/geocode");

const app = express();
app.use(cors());

const rawData = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "danger.json"), "utf-8"));

app.get("/api/danger-zones", async (req, res) => {
  const zones = [];

  for (const item of rawData) {
    const base = `${item.시도} ${item.시군구}`;
    const startAddress = item["시작구간(주소)"] ? `${base} ${item["시작구간(주소)"]}` : null;
    const endAddress = `${base} ${item["끝구간(주소)"]}`;

    if (startAddress) {
      const start = await getCoordsFromAddress(startAddress);
      const end = await getCoordsFromAddress(endAddress);
      if (start && end) {
        zones.push({
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
        zones.push({
          name: item["연번"],
          type: "point",
          coords: coord,
          reason: item["선정사유"],
          length: item["연장(m)"]
        });
      }
    }
  }

  res.json(zones);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행됨: http://localhost:${PORT}/api/danger-zones`);
});
