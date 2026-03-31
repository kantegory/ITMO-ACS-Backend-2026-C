// Формирование стандартного ответа с пагинацией
export const paginatedResponse = (
  items: unknown[],
  total: number,
  page: number,
  pageSize: number
) => {
  return {
    items,
    total,
    page,
    pageSize,
  };
};