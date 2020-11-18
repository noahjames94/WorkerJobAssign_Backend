import { PaginationResults } from "./PaginationResults";

export class Pagination<PaginationEntity> {
  public results: PaginationEntity[];
  public totalPage: number;
  public total: number;
  public page: number;
  public limit: number;

  constructor({ page, results, limit, total }: PaginationResults<PaginationEntity>) {
    this.page = page;
    this.results = results;
    this.totalPage = Math.ceil(total / limit);
    this.total = total;
    this.limit = limit;
  }
}
