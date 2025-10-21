// replace-env.js
const fs = require('fs');

// Читаем app.js
let appJs = fs.readFileSync('app.js', 'utf8');

// Заменяем плейсхолдеры на реальные значения из process.env
appJs = appJs.replace(/%%SUPABASE_URL%%/g, process.env.SUPABASE_URL || '');
appJs = appJs.replace(/%%SUPABASE_ANON_KEY%%/g, process.env.SUPABASE_ANON_KEY || '');

// Записываем обратно
fs.writeFileSync('public/app.js', appJs);
console.log('Environment variables replaced in app.js');
