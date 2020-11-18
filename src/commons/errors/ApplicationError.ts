import { ErrorMessage, Errors } from "@models";

export default class ApplicationError extends Error {
  payload: any = {};
  status: number;
  message: string;
  errorMessage: ErrorMessage;

  constructor (
    status: number,
    type: string,
    message: string,
    errors: Errors = [],
    payload: any = {}
  ) {
    super(message);
    this.errorMessage = new ErrorMessage(type, message, errors);
    this.payload = payload;
    this.status = status;
  }
}
