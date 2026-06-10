export const PAGE_SIZE = 15;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const defaultPagination = (): PaginationMeta => ({
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
});
