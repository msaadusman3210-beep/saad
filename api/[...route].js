// Vercel serverless function handler for Express
module.exports = (req, res) => {
  // Get the app and handle the request
  const app = require('../server/src/index.js');
  
  // Express expects a full Express instance, so we call it as middleware
  return app(req, res);
};


