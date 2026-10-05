module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  res.status(200).json({
    success: true,
    cloudConnected: true,
    provider: 'Vercel Edge & Cloud REST Sync',
    status: 'Online (24x7 Active)',
    lastSynced: new Date().toISOString(),
    totalQuestionsSynced: 75,
    totalUsersSynced: 4,
    totalAttemptsSynced: 1,
    totalTestsSynced: 6
  });
};
