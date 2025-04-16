const express = require('express');
const router = express.Router();
const request = require('request');

const API_KEY = 'CXxGKzRHioR5j8BWcJSHaE9ZsttRZXP%2FGQLo7%2FchqCPAJW7pxl%2BU1umh7e2Jl3fD67XPWYEV9%2FRK03G%2F7p55Qg%3D%3D';

// 전체 사고 리스트 조회
router.get('/api/sinkhole-list', async (req, res) => {
  const { from, to, numOfRows = 100 } = req.query;
  const url = 'http://apis.data.go.kr/1611000/undergroundsafetyinfo/getSubsidenceList';

  const fetchPage = (page) => {
    return new Promise((resolve, reject) => {
      let queryParams = '?' + encodeURIComponent('serviceKey') + '=' + API_KEY;
      queryParams += '&' + encodeURIComponent('sagoDateFrom') + '=' + encodeURIComponent(from);
      queryParams += '&' + encodeURIComponent('sagoDateTo') + '=' + encodeURIComponent(to);
      queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent(numOfRows);
      queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent(page);
      queryParams += '&' + encodeURIComponent('type') + '=' + encodeURIComponent('json');

      const fullUrl = url + queryParams;
      console.log(`📡 API 요청 (page ${page}):`, fullUrl);

      request({ url: fullUrl, method: 'GET' }, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          try {
            const parsed = JSON.parse(body);
            const resultCode = parsed?.response?.header?.resultCode;
            const resultMsg = parsed?.response?.header?.resultMsg;
            const items = parsed?.response?.body?.items?.item || [];
            const totalCount = parsed?.response?.body?.totalCount || 0;

            if (parseInt(resultCode) !== 0) {
              return reject({ error: `공공 API 오류: ${resultMsg}`, raw: parsed });
            }

            resolve({ totalCount, items: Array.isArray(items) ? items : [items] });
          } catch (parseError) {
            reject({ error: '응답 파싱 실패', details: parseError.message });
          }
        } else {
          reject({ error: '요청 실패', details: error || body });
        }
      });
    });
  };

  try {
    const firstPage = await fetchPage(1);
    const totalPages = Math.ceil(firstPage.totalCount / numOfRows);
    let allItems = [...firstPage.items];

    const pagePromises = [];
    for (let page = 2; page <= totalPages; page++) {
      pagePromises.push(fetchPage(page));
    }

    const results = await Promise.all(pagePromises);
    results.forEach(result => allItems.push(...result.items));

    res.json({ totalCount: allItems.length, items: allItems });
  } catch (err) {
    console.error('❌ 전체 조회 오류:', err);
    res.status(500).json(err);
  }
});

// sagoNo로 상세 조회
router.get('/api/sinkhole-detail', (req, res) => {
  const { sagoNo } = req.query;
  const url = 'http://apis.data.go.kr/1611000/undergroundsafetyinfo/getSubsidenceInfo';

  let queryParams = '?' + encodeURIComponent('serviceKey') + '=' + API_KEY;
  queryParams += '&' + encodeURIComponent('sagoNo') + '=' + encodeURIComponent(sagoNo);
  queryParams += '&' + encodeURIComponent('type') + '=' + encodeURIComponent('json');

  const fullUrl = url + queryParams;
  console.log("🔍 상세 조회 요청 URL:", fullUrl);

  request({ url: fullUrl, method: 'GET' }, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      try {
        const parsed = JSON.parse(body);
        const resultCode = parsed?.response?.header?.resultCode;
        const resultMsg = parsed?.response?.header?.resultMsg;
        const item = parsed?.response?.body?.items?.item;

        if (parseInt(resultCode) !== 0) {
          return res.status(500).json({ error: `공공 API 오류: ${resultMsg}`, raw: parsed });
        }

        res.json(item);
      } catch (parseError) {
        res.status(500).json({ error: '상세 응답 파싱 실패', details: parseError.message });
      }
    } else {
      res.status(500).json({ error: '상세 요청 실패', details: error || body });
    }
  });
});

module.exports = router;