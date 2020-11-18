import { LookupDelimiter, LookupFilter } from "./lookupFilter";
import { FieldFilter } from "./fieldFilter";

export class FilterFactory {
  public get(query: any, key: string, value: string) {
    const field = key.split(LookupDelimiter.LOOKUP_DELIMITER)[0];
    const lookup = key.includes(LookupDelimiter.LOOKUP_DELIMITER)
      ? key.split(LookupDelimiter.LOOKUP_DELIMITER)[1] as LookupFilter
      : LookupFilter.EXACT;
    return new FieldFilter(query, field, lookup, value);
  }
}
