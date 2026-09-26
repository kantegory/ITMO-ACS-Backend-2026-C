import SETTINGS from '../config/settings';
import { Role } from '../models/enums/role.enum';
import { callInternal } from './internal-http-client';

// Формы ответов внутреннего API auth (docs/openapi-internal.yaml).
interface UserInternal {
    id: number;
    role: Role;
    first_name: string;
    last_name: string;
}

interface UserShort {
    id: number;
    first_name: string;
    last_name: string;
}

// 400/401 от внутреннего вызова — наша же ошибка (неверный ключ/параметры), не сбой
// вызываемого сервиса: клиенту 500, глобальный error-handler сам залогирует (раздел 7).
function assertNotOurFault(status: number): void {
    if (status === 400 || status === 401) {
        throw new Error(`auth-service internal call failed with status ${status}`);
    }
}

async function getUserInternal(userId: number): Promise<UserInternal | null> {
    const response = await callInternal(
        `${SETTINGS.AUTH_SERVICE_URL}/internal/users/${userId}`,
    );

    if (response.status === 404) {
        return null;
    }
    assertNotOurFault(response.status);

    return (await response.json()) as UserInternal;
}

async function updateUserRole(
    userId: number,
    role: Role,
): Promise<UserInternal | null> {
    const response = await callInternal(
        `${SETTINGS.AUTH_SERVICE_URL}/internal/users/${userId}/role`,
        { method: 'PATCH', body: { role } },
    );

    if (response.status === 404) {
        return null;
    }
    assertNotOurFault(response.status);

    return (await response.json()) as UserInternal;
}

async function getUsersShort(ids: number[]): Promise<UserShort[]> {
    if (ids.length === 0) {
        return [];
    }

    const response = await callInternal(
        `${SETTINGS.AUTH_SERVICE_URL}/internal/users?ids=${ids.join(',')}`,
    );

    assertNotOurFault(response.status);

    return (await response.json()) as UserShort[];
}

export { getUserInternal, updateUserRole, getUsersShort };
export type { UserInternal, UserShort };
