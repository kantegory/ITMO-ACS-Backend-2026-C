// Копия лр1/src/utils/db-errors.ts. SQLSTATE-коды Postgres.
const FOREIGN_KEY_VIOLATION = '23503';
const UNIQUE_VIOLATION = '23505';

function isForeignKeyViolation(error: unknown): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        (error as { code?: string }).code === FOREIGN_KEY_VIOLATION
    );
}

function isUniqueViolation(error: unknown): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        (error as { code?: string }).code === UNIQUE_VIOLATION
    );
}

export { isForeignKeyViolation, isUniqueViolation };
