import { IsNotEmpty } from "class-validator";
import { Column } from "typeorm";
/**
 * NESTED OBJECT
 * This is not an entity
 */

export class WorkingHours {
  @Column()
  @IsNotEmpty()
  begin: {
    hour: number | string;
    minute: number | string;
  };
  @Column()
  @IsNotEmpty()
  end: {
    hour: number | string;
    minute: number | string;
  };
  date?: Date;
}
