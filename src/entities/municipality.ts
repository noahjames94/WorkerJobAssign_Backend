import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { Column } from "typeorm";
/**
 * NESTED OBJECT
 * This is not an entity
 */

export class Municipality {

  @Column()
  @IsString()
  @IsNotEmpty()
  label: string;

  @Column()
  @IsNumber()
  @IsNotEmpty()
  value: number;
}
