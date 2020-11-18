import { Column } from "typeorm";
import { Buildable } from "@commons/decorators";
import { ApplicationEntity } from "./applicationEntity";

@Buildable
export class Department extends ApplicationEntity {
  @Column()
  name: string;
}
