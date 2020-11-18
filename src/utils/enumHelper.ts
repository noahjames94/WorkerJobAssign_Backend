import { number, string } from "prop-types";

export class EnumHelper {
  keys: any[];
  values: number[];

  constructor(obj: Object) {
    this.keys = Object.keys(obj).filter(k => typeof (<any>obj)[k as any] === "number"); // ["A", "B"]
    this.values = this.keys.map(k => (<any>obj)[k as any]); // [0, 1]
  }

  searchByName(str: string, returns: string = "keys"): string[] | number[] {
    let res: Array<any>;
    if (returns === "keys") {
      res = new Array<string>();
    } else {
      res = new Array<number>();
    }
    this.keys.forEach((keyName: string, index) => {
      const re = new RegExp(str, "si");
      if (keyName.match(re)) {
        if (returns === "keys") {
          res.push(keyName);
        } else {
          res.push(this.values[index]);
        }
      }
    });
    return res;
  }
}
export default EnumHelper;
