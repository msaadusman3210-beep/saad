const app = require('../server/src/index.js');

export default function handler(req, res) {
  return app(req, res);
}

