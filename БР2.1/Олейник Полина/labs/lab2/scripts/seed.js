// Тестовые данные для этапа 6 (докрутка ДЗ4): заводит двух "сидовых" пользователей,
// которых требуют коллекции Postman из docs/postman-collections/ (ЛР1.postman_environment.json,
// переменные adminEmail/adminPassword, ownerEmail/ownerPassword) — сами коллекции их не
// регистрируют, только логинятся и сразу проверяют роль.
//
// Без зависимостей: глобальный fetch (Node 18+), запускается напрямую через node,
// сборка/tsx не нужны — скрипт не использует декораторы/типы фреймворка.
// Идемпотентен: безопасно перезапускать на уже заполненной базе.
//
// Запуск: node scripts/seed.js
// (Path к node — как в остальных инструкциях проекта, раздел 3 CLAUDE.md)

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'internal-secret';

const SEED_USERS = [
    {
        email: 'admin@example.com',
        password: 'admin12345',
        first_name: 'Admin',
        last_name: 'Seed',
        role: 'ADMIN',
    },
    {
        email: 'owner@example.com',
        password: 'owner12345',
        first_name: 'Owner',
        last_name: 'Seed',
        role: 'RESTAURANT_ADMIN',
    },
];

async function registerOrLogin(user) {
    const registerResponse = await fetch(`${AUTH_SERVICE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: user.email,
            password: user.password,
            first_name: user.first_name,
            last_name: user.last_name,
        }),
    });

    if (registerResponse.status === 201) {
        const body = await registerResponse.json();
        console.log(`  зарегистрирован ${user.email} (id=${body.user.id})`);
        return body.user;
    }

    if (registerResponse.status === 409) {
        const loginResponse = await fetch(`${AUTH_SERVICE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, password: user.password }),
        });

        if (!loginResponse.ok) {
            throw new Error(
                `${user.email} уже зарегистрирован, но вход не удался (${loginResponse.status}) — проверьте пароль`,
            );
        }

        const body = await loginResponse.json();
        console.log(`  уже существует ${user.email} (id=${body.user.id})`);
        return body.user;
    }

    throw new Error(`Не удалось зарегистрировать ${user.email}: ${registerResponse.status}`);
}

async function ensureRole(userId, targetRole) {
    const current = await fetch(`${AUTH_SERVICE_URL}/internal/users/${userId}`, {
        headers: { 'X-Internal-Token': INTERNAL_API_KEY },
    });
    if (!current.ok) {
        throw new Error(`Не удалось прочитать пользователя ${userId}: ${current.status}`);
    }
    const currentUser = await current.json();

    if (currentUser.role === targetRole) {
        console.log(`  роль уже ${targetRole}`);
        return;
    }

    const update = await fetch(`${AUTH_SERVICE_URL}/internal/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_API_KEY,
        },
        body: JSON.stringify({ role: targetRole }),
    });
    if (!update.ok) {
        throw new Error(`Не удалось назначить роль ${targetRole} пользователю ${userId}: ${update.status}`);
    }

    console.log(`  роль назначена: ${targetRole}`);
}

async function main() {
    for (const seedUser of SEED_USERS) {
        console.log(`Пользователь ${seedUser.email}:`);
        const user = await registerOrLogin(seedUser);
        await ensureRole(user.id, seedUser.role);
    }

    console.log('Готово.');
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
