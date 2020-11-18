import { MetadataObj } from "@commons";
import { validateOrReject } from "class-validator";
import { pick } from "lodash";

import { ValidationError } from "@commons/errors";

type BuildableEntity = {
  [key: string]: any;
  assignAttributes: void,
  validate: Promise<any>,
};

export function Buildable<BuildableEntity extends {new(...args: any[]): {}}>(constructor: BuildableEntity) {
  return class extends constructor {
    [key: string]: any;

    assignAttributes: Function = (args: MetadataObj, permitKeys: Array<string> = []): void => {
      const keys = permitKeys.length === 0 ? Object.keys(args) : permitKeys;
      Object.assign(this, pick(args, keys));
    }

    validate: Function = async (): Promise<any> => {
      try {
        await validateOrReject(this);
      } catch (errors) {
        console.log(errors);
        throw new ValidationError({ errors, obj: this });
      }
    }

    save = async () => {
      return this.repository.manager.save(this);
    }
  };
}
