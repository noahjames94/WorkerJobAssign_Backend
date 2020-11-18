import { LookupFilter } from "./lookupFilter";

export class FieldFilter {
  public query: any;
  prop: string;
  lookup: LookupFilter;
  value: string;

  constructor(query: any, prop: string, lookup: LookupFilter, value: string) {
    this.query = query;
    this.prop = prop;
    this.lookup = lookup;
    this.value = value;
  }

  public buildQuery() {
    let queryToAdd;

    switch (this.lookup) {
      case LookupFilter.CONTAINS:
        queryToAdd = { [this.prop]: new RegExp(this.value) };
        break;
      case LookupFilter.EXACT:
        queryToAdd = { [this.prop]: this.value };
    }

    this.query["where"] = {
      ...this.query["where"],
      ...queryToAdd
    };
  }
}
