export type Errors = { field: string, messages: Array<string> }[];

export class ErrorMessage {
  type: string;
  message: string;
  errors: Errors;

  constructor(type: string, message: string, errors: Errors) {
    this.type = type;
    this.message = message;
    this.errors = errors;
  }
}
