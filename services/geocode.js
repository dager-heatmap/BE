const axios = require("axios");

const NAVER_CLIENT_ID = "f0a5l6s8em";
const NAVER_CLIENT_SECRET = "B88PpCSX8eMEZ6JgfJ5p5tG9dHRNtCnNK1b9W3JP";

async function getCoordsFromAddress(address) {
  try {
    const url = "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode";
    console.log(`🔍 요청 중: ${url}?query=${encodeURIComponent(address)}`);

    const res = await axios.get(url, {
      params: { query: address },
      headers: {
        "X-NCP-APIGW-API-KEY-ID": NAVER_CLIENT_ID,
        "X-NCP-APIGW-API-KEY": NAVER_CLIENT_SECRET
      }
    });

    const addresses = res.data.addresses;

    if (addresses.length === 0) {
      console.warn(`⚠️ '${address}' → 결과 없음`);
      return null;
    }

    const { y, x } = addresses[0]; // 위도(y), 경도(x)
    console.log(`✅ '${address}' → 위도: ${y}, 경도: ${x}`);
    return [parseFloat(y), parseFloat(x)];

  } catch (e) {
    console.error(`❌ Geocoding 실패: '${address}'`);
    if (e.response) {
      console.error(`  - 상태코드: ${e.response.status}`);
      console.error(`  - 응답내용: ${JSON.stringify(e.response.data)}`);
    } else if (e.request) {
      console.error("  - 요청은 보냈으나 응답 없음");
    } else {
      console.error("  - 요청 생성 중 오류:", e.message);
    }
    return null;
  }
}

module.exports = getCoordsFromAddress;
