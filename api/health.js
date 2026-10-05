module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  res.status(200).json({
    status: 'online',
    server: 'SHREE TEACH Vercel Cloud Serverless',
    version: '2.5.0',
    port: 'Cloud',
    uptime_seconds: 86400,
    uptime_formatted: '24x7 Cloud Active',
    cloud_status: 'connected',
    total_questions: 75,
    total_users: 4,
    platform_name: 'SHREE TEACH JEE Preparation System'
  });
};
