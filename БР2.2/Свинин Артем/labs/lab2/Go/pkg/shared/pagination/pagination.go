package pagination

// Page is a shared JSON shape for paginated API responses.
type Page[T any] struct {
	Items    []T `json:"items"`
	Total    int `json:"total"`
	Page     int `json:"page"`
	PageSize int `json:"pageSize"`
}

func Paginate[T any](items []T, page int, pageSize int) ([]T, int) {
	total := len(items)
	if total == 0 {
		return []T{}, 0
	}

	start := (page - 1) * pageSize
	if start >= total {
		return []T{}, total
	}

	end := start + pageSize
	if end > total {
		end = total
	}

	return items[start:end], total
}
