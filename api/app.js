// Инициализация Supabase
// Эти переменные будут установлены вручную или через Vercel
const supabaseUrl = 'https://your-project.supabase.co'; // ЗАМЕНИТЕ на ваш URL
const supabaseAnonKey = 'your-anon-key'; // ЗАМЕНИТЕ на ваш ключ

// Инициализируем клиент Supabase
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// Элементы DOM
const warnsList = document.getElementById('warnsList');
const totalWarns = document.getElementById('totalWarns');
const todayWarns = document.getElementById('todayWarns');
const uniqueUsers = document.getElementById('uniqueUsers');
const searchInput = document.getElementById('searchInput');

// Переменные состояния
let currentSearchUserId = '';

// Загрузка данных при старте
document.addEventListener('DOMContentLoaded', function() {
    console.log('Supabase клиент инициализирован');
    console.log('URL:', supabaseUrl);
    loadWarns();
    loadStats();
});

// Загрузка списка предупреждений
async function loadWarns() {
    try {
        showsLoading();
        
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
