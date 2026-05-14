model Page<T> {
  items: T[];
  total: int32;
  page: int32;
  limit: int32;
}