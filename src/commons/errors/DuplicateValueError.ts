import ApplicationError from "./ApplicationError";
import { Errors } from "@models";

type ErrorPayload = {
  errors: any,
};


const generateMessage = (errors: any = {}): Errors => {
  const { err: { errmsg } } = errors;
  const detectValueRegex = /dup key: {\s*(\w*)\s*:\s*\"?([^\s}]*)\"?\s*}/gm;
  const [_, field, value] = detectValueRegex.exec(errmsg) || ["", "", ""];
  return [{
    field: `${field}`,
    messages: [
      `"${field}: ${value}" is already in use!`
    ],
  }];
};

export default class DuplicateValueError extends ApplicationError {
  constructor ({
    errors,
    ...payload
  }: ErrorPayload) {
    super(
      422,
      "validation_error",
      "Validation Error!",
      generateMessage(errors),
      payload,
    );
  }
}
