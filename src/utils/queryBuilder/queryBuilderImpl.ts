import { Request } from "express";
import { merge } from "lodash";

import { QueryBuilder } from "./queryBuilder";

import { FindConditions } from "typeorm";
import { FilterFactory } from "./filterFactory";
import { ITEMS_PER_PAGE } from "./const";

export class QueryBuilderImpl<T> implements QueryBuilder<T> {
  typeORMQuery: any;
  expressQuery: any;

  page: number;
  limit: number;

  constructor(req: Request, appQuery: any = {}) {
    this.expressQuery = merge({}, req.query, appQuery);
    this.typeORMQuery = {};
  }

  build(appQuery: any = {}): FindConditions<T> {
    const filterFactory = new FilterFactory();

    this.page = (this.expressQuery["page"] && parseInt(this.expressQuery["page"], 10)) || 0;
    this.limit = (this.expressQuery["limit"] && parseInt(this.expressQuery["limit"], 10)) || ITEMS_PER_PAGE;

    this.setOrder();
    this.setPage();
    this.setLimit();

    for (const queryItem in merge({}, this.expressQuery, appQuery)) {
      const factory = filterFactory.get(this.typeORMQuery, queryItem, this.expressQuery[queryItem]);

      factory.buildQuery();
    }

    return this.typeORMQuery;
  }

  private setLimit() {
    this.typeORMQuery["take"] = this.limit;

    delete this.expressQuery["limit"];
  }

  private setPage() {
    this.typeORMQuery["skip"] = (this.page > 1) ? (this.page - 1) * (this.limit) : 0;
    delete this.expressQuery["page"];
  }

  private setOrder() {
    if (!this.expressQuery["order"]) {
      return;
    }
    const orderFields = this.expressQuery["order"].split(",");
    for (const field of orderFields) {
      const orderCritia = this.getOrderCriteria(field);

      this.typeORMQuery["order"] = {
        ...this.typeORMQuery["order"],
        [field.substr(1, field.length)]: orderCritia
      };
    }

    delete this.expressQuery["order"];
  }

  private getOrderCriteria(field: string): string {
    if (field.startsWith("+")) {
      return "ASC";
    } else if (field.startsWith("-")) {
      return "DESC";
    } else {
      throw new Error(`No order set for <${field}>. Prefix with one of these: [+, -]`);
    }
  }
}
