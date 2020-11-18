import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments
} from "class-validator";

@ValidatorConstraint({ name: "conedEmailValidator", async: false })
export class ConedEmailValidator implements ValidatorConstraintInterface {
  validate(email: string, args: ValidationArguments) {
    return email && email.endsWith("@coned.com");
  }

  defaultMessage(args: ValidationArguments) {
    return "Email address must be Coned's email";
  }
}
