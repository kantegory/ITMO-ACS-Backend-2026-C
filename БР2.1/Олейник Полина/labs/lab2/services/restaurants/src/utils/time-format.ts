// Копия лр1/src/utils/time-format.ts. Postgres 'time' возвращает "HH:MM:SS", спецификации нужен "HH:MM".
function formatTime(time: string): string {
    return time.slice(0, 5);
}

export { formatTime };
