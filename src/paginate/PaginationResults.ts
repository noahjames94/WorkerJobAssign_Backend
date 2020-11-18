export interface PaginationResults<PaginationEntity> {
  results: PaginationEntity[];
  total: number;
  page: number;
  limit: number;
  next?: string;
  previous?: string;
}
