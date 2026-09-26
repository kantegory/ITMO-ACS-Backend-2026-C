type Service = 'auth' | 'restaurants' | 'bookings';

// Таблица раздела 6 CLAUDE.md, проверяется по порядку "от точных к общим".
// path приходит уже без префикса /api/v1 (см. app.ts), например "/auth/register",
// "/users/me", "/restaurants/5/availability".
//
// /cities и /cuisines в таблице раздела 6 указаны без "/*", но DELETE /cities/{id}
// и DELETE /cuisines/{id} — реальные документированные операции с параметром пути,
// поэтому читаю запись как сокращение "всё под этим корнем" (иначе часть из 43
// операций вообще не работала бы через gateway — то, что явно требует проверка этапа).
function startsWithSegment(path: string, prefix: string): boolean {
    return path === prefix || path.startsWith(`${prefix}/`);
}

function resolveTarget(path: string): Service | null {
    // "/internal/*" никогда не публикуется, независимо от остальных правил.
    if (startsWithSegment(path, '/internal')) {
        return null;
    }

    if (path === '/users/me') {
        return 'auth';
    }
    if (path === '/users/me/bookings') {
        return 'bookings';
    }
    if (startsWithSegment(path, '/bookings')) {
        return 'bookings';
    }
    if (/^\/restaurants\/[^/]+\/availability$/.test(path)) {
        return 'bookings';
    }
    if (startsWithSegment(path, '/auth')) {
        return 'auth';
    }
    if (
        startsWithSegment(path, '/cities') ||
        startsWithSegment(path, '/cuisines') ||
        startsWithSegment(path, '/restaurants') ||
        startsWithSegment(path, '/reviews')
    ) {
        return 'restaurants';
    }

    return null;
}

export { resolveTarget };
export type { Service };
