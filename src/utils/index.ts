import { toHexString } from "../commons";

export { ValidationErrorParser, ValidationErrorParserImpl } from "./errorParsers";

const {ObjectId} = require("mongodb").ObjectId;
export function toObjectId(value: any) {
    let _res: any = value;
    if (typeof value === "string") {
        _res = ObjectId(value);
    }
    return ObjectId(_res);
}