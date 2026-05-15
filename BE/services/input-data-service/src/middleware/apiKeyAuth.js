module.exports = function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.DATA_API_KEY?.replace(/^['"]|['"]$/g, '');
  console.log('API Key from request:', apiKey);
  console.log('Valid API Key from env:', validKey);
  if (!apiKey || !validKey || apiKey !== validKey) {
    console.log('API Key mismatch or missing!');
    return res.status(401).json({ success: false, message: 'Invalid or missing API Key' });
  }
  next();
}; 