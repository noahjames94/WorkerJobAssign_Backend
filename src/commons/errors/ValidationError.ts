import ApplicationError from "./ApplicationError";
import { ValidationErrorParserImpl } from "@utils";

type ValidationErrorPayload = {
  errors: any,
  obj: any,
};

export default class ValidationError extends ApplicationError {
  public obj: any;

  constructor ({
    errors,
    obj,
    ...payload
  }: ValidationErrorPayload) {
    super(
      422,
      "validation_error",
      "Validation Error!",
      new ValidationErrorParserImpl().parse(errors),
      payload,
    );
    this.obj = obj;
  }
}
