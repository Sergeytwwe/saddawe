import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      console.log('=== DEBUG INFO ===');
      console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
      console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);
      
      if (process.env.SUPABASE_URL) {
        console.log('SUPABASE_URL:', process.env.SUPABASE_URL.substring(0, 20) + '...');
      }
      if (process.env.SUPABASE_ANON_KEY) {
        console.log('SUPABASE_ANON_KEY starts with:', process.env.SUPABASE_ANON_KEY.substring(0, 20) + '...');
      }

      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        throw new Error('Missing environment variables');
      }

      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      console.log('Fetching from user_warns...');
      
      const { data: warns, error } = await supabase
        .from('user_warns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase Error:', error);
        throw error;
      }

      console.log('Success! Found warns:', warns?.length || 0);
      
      // Если данных нет, возвращаем пустой массив
      res.status(200).json(warns || []);

    } catch (error) {
      console.error('FULL ERROR:', error);
      
      // Возвращаем ошибку чтобы увидеть в браузере
      res.status(500).json({ 
        error: error.message,
        details: 'Check Vercel logs for full error',
        envCheck: {
          hasUrl: !!process.env.SUPABASE_URL,
          hasKey: !!process.env.SUPABASE_ANON_KEY
        }
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
