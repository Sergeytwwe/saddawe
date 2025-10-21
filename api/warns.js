import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Настройка CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      console.log('Connecting to Supabase with ANON key...');
      
      // Проверяем environment variables
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase environment variables');
      }

      // Создаем клиент Supabase с ANON ключом
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      console.log('Fetching data from user_warns table...');

      // Получаем данные из таблицы
      const { data: warns, error } = await supabase
        .from('user_warns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log(`Found ${warns?.length || 0} warnings`);

      // Возвращаем данные
      res.status(200).json(warns || []);

    } catch (error) {
      console.error('API Error:', error);
      
      // Возвращаем тестовые данные если ошибка
      const testData = [
        {
          id: 1,
          user_id: "fallback_user",
          reason: "Тест из API (ошибка: " + error.message + ")",
          created_at: new Date().toISOString()
        }
      ];
      
      res.status(200).json(testData);
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
