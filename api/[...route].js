let app;

// Lazy load and cache the Express app
function getApp() {
  if (!app) {
    app = require('../server/src/index.js');
  }
  return app;
}

// Vercel serverless function handler
module.exports = (req, res) => {
  const expressApp = getApp();
  
  // Call Express app as middleware
  return expressApp(req, res);
};



