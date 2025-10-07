process.env.JASHOO_NO_LISTEN = 'true';
const request = require('supertest');
const app = require('../server');
(async () => {
  try {
    const res = await request(app).get('/health');
    console.log(JSON.stringify(res.body));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
