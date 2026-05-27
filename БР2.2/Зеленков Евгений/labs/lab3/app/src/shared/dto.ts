export function listDto<T>(items: T[], page: number, limit: number, total: number) {
  return { items, meta: { page, limit, total } };
}
