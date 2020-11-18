import { ValidationError } from "class-validator";

export interface ValidationErrorParser {
  parse(errors: ValidationError[]): { field: string, messages: Array<string> }[];
}
