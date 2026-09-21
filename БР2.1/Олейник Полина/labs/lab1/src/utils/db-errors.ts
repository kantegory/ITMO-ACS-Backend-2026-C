// Коды ошибок Postgres — это стандартные пятизначные коды из документации Postgres
// (SQLSTATE), не наша выдумка. Они одинаковые для любой программы, которая
// работает с Postgres, не только для этого проекта.
const FOREIGN_KEY_VIOLATION = '23503'; // нарушение внешнего ключа: пытаемся удалить строку, на которую кто-то ссылается
const UNIQUE_VIOLATION = '23505'; // нарушение уникальности: такая запись уже есть

// Проверяет, что ошибка — это именно нарушение внешнего ключа.
// Используется в контроллерах при удалении: вместо невнятной ошибки 500
// от голого SQL мы ловим именно эту ситуацию и отвечаем понятным 409.
function isForeignKeyViolation(error: unknown): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        (error as { code?: string }).code === FOREIGN_KEY_VIOLATION
    );
}

// То же самое, но для нарушения уникальности — пригождается там, где проверка
// "такая запись уже есть" в коде могла не успеть сработать из-за одновременных запросов,
// а база всё равно не даст создать дубликат (например, слот с одинаковым временем).
function isUniqueViolation(error: unknown): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        (error as { code?: string }).code === UNIQUE_VIOLATION
    );
}

export { isForeignKeyViolation, isUniqueViolation };
