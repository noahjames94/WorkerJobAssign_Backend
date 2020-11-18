import { map } from "lodash";

import { ErrorMessage, Errors } from "@models";
import { ApplicationError } from ".";

export default class AppStandardError extends ApplicationError {
  payload: any = {};
  status: number;
  message: string;
  errorMessage: ErrorMessage;

  constructor (
    type: string,
    message: string,
    errorMessage: Array<string> = [],
    payload: { errors?: Errors } = {}
  ) {
    super(400, type, message, [], payload);
    const { errors = [{ field: "noneField", messages: errorMessage }] } = payload;
    this.errorMessage = new ErrorMessage(type, message, errors);
  }
}
