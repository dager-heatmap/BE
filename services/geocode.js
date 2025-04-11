const axios = require("axios");

const KAKAO_API_KEY = "KakaoAK 64305d8e302b503142552e8d814bf56a"; // 반드시 REST API 키

async function getCoordsFromAddress(address) {
  try {
    const url = "https://dapi.kakao.com/v2/local/search/address.json";
    console.log(`🔍 요청 중: ${url}?query=${encodeURIComponent(address)}`);

    const res = await axios.get(url, {
      params: { query: address },
      headers: { Authorization: KAKAO_API_KEY }
    });

    // 성공 but 주소 없음
    if (res.data.documents.length === 0) {
      console.warn(`⚠️ '${address}' → 결과 없음`);
      return null;
    }

    const { x, y } = res.data.documents[0].address;
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
