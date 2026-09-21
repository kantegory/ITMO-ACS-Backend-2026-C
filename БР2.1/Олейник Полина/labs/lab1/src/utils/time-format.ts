// Колонки типа 'time' в Postgres возвращаются в формате "HH:MM:SS" (например "12:00:00"),
// а спецификации нужен формат "HH:MM" (например "12:00"). Эта функция просто
// обрезает лишние секунды — берёт первые 5 символов строки.
function formatTime(time: string): string {
    return time.slice(0, 5);
}

export { formatTime };
