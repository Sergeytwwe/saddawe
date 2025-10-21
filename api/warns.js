export default async function handler(req, res) {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      // Пока возвращаем тестовые данные
      const testData = [
        {
          id: 1,
          user_id: "test_user_1",
          reason: "Тестовое предупреждение 1",
          created_at: new Date().toISOString()
        },
        {
          id: 2, 
          user_id: "test_user_2",
          reason: "Тестовое предупреждение 2",
          created_at: new Date().toISOString()
        }
      ];

      console.log('Returning test data');
      res.status(200).json(testData);

    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
