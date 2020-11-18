import { ValidationErrorParser } from "./validationErrorParser";
import { ValidationError } from "class-validator";
import { map, startCase } from "lodash";

export class ValidationErrorParserImpl implements ValidationErrorParser {
  parse(errors: ValidationError[]) {
    return errors.map(error => {
      const { property: field, constraints } = error;

      return {
        field,
        messages: map(error.constraints, (message) => {
          return message.replace(field, startCase(field));
        }),
      };
    });
  }
}
