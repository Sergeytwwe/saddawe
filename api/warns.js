import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      console.log('Environment check:', {
        hasUrl: !!process.env.SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_SERVICE_KEY
      });

      // Проверяем наличие environment variables
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
        throw new Error('Supabase environment variables are missing');
      }

      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );

      console.log('Fetching warns from Supabase...');

      const { data: warns, error } = await supabase
        .from('user_warns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log(`Successfully fetched ${warns?.length || 0} warns`);

      res.status(200).json(warns || []);
      
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ 
        error: error.message,
        details: 'Check server logs and environment variables'
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
