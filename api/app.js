// Инициализация Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

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
            .select('user_id')
            .then(response => {
                if (response.error) throw response.error;
                const unique = new Set(response.data.map(item => item.user_id));
                return { data: Array.from(unique), error: null };
            });

        if (uniqueError) throw uniqueError;

        // Обновляем статистику
        totalWarns.textContent = totalCount || 0;
        todayWarns.textContent = todayCount || 0;
        uniqueUsers.textContent = uniqueUsersData ? uniqueUsersData.length : 0;

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
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Реал-тайм обновление (опционально)
function subscribeToUpdates() {
    supabase
        .channel('user_warns_changes')
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'user_warns' 
            }, 
            () => {
                // При любых изменениях в таблице обновляем данные
                loadWarns();
                loadStats();
            }
        )
        .subscribe();
}

// Активируем реал-тайм обновления (раскомментируйте если нужно)
// subscribeToUpdates();
