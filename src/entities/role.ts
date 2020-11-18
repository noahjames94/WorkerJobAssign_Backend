import { Column, Entity } from "typeorm";

import { ApplicationEntity } from "./applicationEntity";
import { Buildable } from "@commons/decorators";

@Entity()
@Buildable
export class Role extends ApplicationEntity {
  tableName = "role";

  @Column()
  name: string;
}
