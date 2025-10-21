// app.js
// Переменные будут установлены через Vercel во время сборки
// Но в браузере process.env не работает, поэтому нужен обходной путь

// Для Vercel - создадим конфиг прямо в коде
// Эти значения будут заменены во время сборки
const supabaseUrl = '%%SUPABASE_URL%%';
const supabaseAnonKey = '%%SUPABASE_ANON_KEY%%';

console.log('Supabase config:', { 
    url: supabaseUrl,
    key: supabaseAnonKey ? '***' + supabaseAnonKey.slice(-4) : 'empty'
});

// Проверяем что переменные загружены
function checkConfig() {
    if (!supabaseUrl || !supabaseAnonKey || 
        supabaseUrl === '%%SUPABASE_URL%%' || 
        supabaseAnonKey === '%%SUPABASE_ANON_KEY%%') {
        
        document.getElementById('configError').style.display = 'block';
        document.querySelector('.controls').style.display = 'none';
        document.querySelector('.warns-container').style.display = 'none';
        
        console.error('❌ Supabase environment variables not configured!');
        showError('Не настроены переменные окружения Supabase. Проверьте настройки Vercel.');
        return false;
    }
    return true;
}

// Элементы DOM
const warnsList = document.getElementById('warnsList');
const totalWarns = document.getElementById('totalWarns');
const todayWarns = document.getElementById('todayWarns');
const uniqueUsers = document.getElementById('uniqueUsers');
const searchInput = document.getElementById('searchInput');

// Переменные состояния
let currentSearchUserId = '';
let supabase;

// Загрузка данных при старте
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking config...');
    
    // Проверяем конфигурацию
    if (!checkConfig()) {
        return;
    }

    // Инициализируем Supabase
    try {
        supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        console.log('Supabase клиент инициализирован');
        
        // Тестируем подключение и загружаем данные
        testConnection().then(() => {
            loadWarns();
            loadStats();
        });
    } catch (err) {
        console.error('Ошибка инициализации Supabase:', err);
        showError('Ошибка инициализации: ' + err.message);
    }
});

// Тест подключения к Supabase
async function testConnection() {
    try {
        console.log('Testing Supabase connection...');
        const { data, error } = await supabase
            .from('user_warns')
            .select('id')
            .limit(1);
            
        if (error) {
            console.error('Ошибка подключения к Supabase:', error);
            showError('Ошибка подключения к базе данных: ' + error.message);
            return false;
        } else {
            console.log('✅ Подключение к Supabase успешно');
            return true;
        }
    } catch (err) {
        console.error('Критическая ошибка:', err);
        showError('Критическая ошибка: ' + err.message);
        return false;
    }
}

// Загрузка списка предупреждений
async function loadWarns() {
    try {
        showsLoading();
        console.log('Loading warns...');
        
        let query = supabase
            .from('user_warns')
            .select('*')
            .order('created_at', { ascending: false });

        // Если есть поисковый запрос, фильтруем по user_id
        if (currentSearchUserId) {
            query = query.ilike('user_id', `%${currentSearchUserId}%`);
        }

        const { data: warns, error } = await query;

        if (error) {
            throw error;
        }

        console.log('Загружено предупреждений:', warns?.length);
        displayWarns(warns);
    } catch (error) {
        console.error('Ошибка загрузки предупреждений:', error);
        showError('Ошибка загрузки данных: ' + error.message);
    }
}

// Загрузка статистики
async function loadStats() {
    try {
        console.log('Loading stats...');
        
        // Общее количество предупреждений
        const { count: totalCount, error: totalError } = await supabase
            .from('user_warns')
            .select('*', { count: 'exact', head: true });

        if (totalError) throw totalError;

        // Предупреждения за сегодня
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count: todayCount, error: todayError } = await supabase
            .from('user_warns')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());

        if (todayError) throw todayError;

        // Уникальные пользователи
        const { data: uniqueUsersData, error: uniqueError } = await supabase
            .from('user_warns')
            .select('user_id');

        if (uniqueError) throw uniqueError;

        const uniqueUsersSet = new Set(uniqueUsersData.map(item => item.user_id));

        // Обновляем статистику
        totalWarns.textContent = totalCount || 0;
        todayWarns.textContent = todayCount || 0;
        uniqueUsers.textContent = uniqueUsersSet.size;

        console.log('Stats loaded:', { totalCount, todayCount, uniqueUsers: uniqueUsersSet.size });

    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// Отображение предупреждений
function displayWarns(warns) {
    if (!warns || warns.length === 0) {
        warnsList.innerHTML = '<div class="no-data">Предупреждения не найдены</div>';
        return;
    }

    const warnsHTML = warns.map(warn => `
        <div class="warn-item">
            <div class="warn-id">#${warn.id}</div>
            <div class="user-id">${escapeHtml(warn.user_id)}</div>
            <div class="reason">${escapeHtml(warn.reason || 'Причина не указана')}</div>
            <div class="date">${formatDate(warn.created_at)}</div>
        </div>
    `).join('');

    warnsList.innerHTML = warnsHTML;
}

// Поиск предупреждений
function searchWarns() {
    const searchValue = searchInput.value.trim();
    if (searchValue) {
        currentSearchUserId = searchValue;
        loadWarns();
    }
}

// Сброс поиска
function clearSearch() {
    searchInput.value = '';
    currentSearchUserId = '';
    loadWarns();
}

// Поиск при нажатии Enter
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchWarns();
    }
});

// Вспомогательные функции
function showsLoading() {
    warnsList.innerHTML = '<div class="loading">Загрузка данных...</div>';
}

function showError(message) {
    warnsList.innerHTML = `<div class="error">${escapeHtml(message)}</div>`;
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return 'Неверная дата';
    }
}
