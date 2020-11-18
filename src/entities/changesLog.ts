import { Column } from "typeorm";
import { IsDate, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { Exclude } from "class-transformer";
import { User } from "./user";
import { EROLES } from "../constants";
import _, { isObject } from "lodash";

/**
 * NESTED OBJECT
 * This is not an entity
 */
export enum SOURCE {
  WEB = "Web",
  MOBILE = "Mobile App",
}

export class ChangesLog {
  @Column({ default: new Date() })
  @IsDate()
  updatedAt: Date;

  @ValidateNested()
  @IsString()
  @IsNotEmpty()
  fields: FieldChanges[];

  @Column()
  @IsNotEmpty()
  updatedBy: string;

  @Column()
  @IsNotEmpty()
  updaterName: string;

  @Column({ default: SOURCE.WEB })
  @IsNotEmpty()
  source: SOURCE;

  @Exclude()
  public static createLog(
    permitedAttrs: Array<string> = [],
    oldObject: Object,
    newObject: Object,
    author: User
  ) {
    const changes: ChangesLog = new ChangesLog();
    changes.updatedBy = author.id.toString();
    changes.updaterName = author.name;
    changes.source = author.roles.includes(EROLES.worker)
      ? SOURCE.MOBILE
      : SOURCE.WEB;
    changes.updatedAt = new Date();

    console.log("newObject: ", newObject);

    for (const [key, value] of Object.entries(newObject)) {
      console.log("key, value: ", key, value);
      console.log("oldObject: ", oldObject);
      console.log("=========");
      if (!permitedAttrs.includes(key)) {
        continue;
      }
      // if ((<any>oldObject)[key] && isObject((<any>oldObject)[key]) && isObject((<any>oldObject)[key])) {
      // 	console.log(this.difference((<any>oldObject)[key], value));
      // }
      if (
        (<any>oldObject).hasOwnProperty(key) &&
        JSON.stringify((<any>oldObject)[key]) === JSON.stringify(value)
      ) {
        continue;
      }
      if (!changes.fields) {
        changes.fields = new Array<FieldChanges>();
      }
      const fieldLog = new FieldChanges();
      fieldLog.fieldName = key;

      if (
        (<any>oldObject)[key] &&
        isObject((<any>oldObject)[key]) &&
        isObject((<any>oldObject)[key])
      ) {
        console.log(this.difference((<any>oldObject)[key], value));
      }
      fieldLog.oldValue = (<any>oldObject)[key]
        ? JSON.stringify((<any>oldObject)[key])
        : "-";
      fieldLog.newValue = value ? JSON.stringify(value) : "-";

      if (fieldLog.oldValue === fieldLog.newValue) {
        console.log("11111");
        continue;
      }
      console.log("fieldLog: ", fieldLog);
      console.log("*************");
      changes.fields.push(fieldLog);
    }
    console.log("changes: ", changes);
    return changes;
  }

  public static difference(object: any, base: any) {
    function changes(object: any, base: any) {
      return _.transform(object, function (result: any, value, key) {
        if (!_.isEqual(value, { ...base }[key])) {
          result[key] =
            _.isObject(value) && _.isObject({ ...base }[key])
              ? changes(value, { ...base }[key])
              : { new: { [key]: value }, old: { [key]: { ...base }[key] } };
        }
      });
    }
    return changes(object, base);
  }

  @Exclude()
  public static isFunction(functionToCheck: any) {
    return (
      functionToCheck &&
      {}.toString.call(functionToCheck) === "[object Function]"
    );
  }
}

export class FieldChanges {
  @IsString()
  @IsNotEmpty()
  fieldName: string;

  @IsString()
  oldValue: string;

  @IsString()
  @IsNotEmpty()
  newValue: string;
}
