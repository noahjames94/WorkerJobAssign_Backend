import { IsNotEmpty, IsNumber } from "class-validator";
import { Column } from "typeorm";
import { Exclude } from "class-transformer";
/**
 * NESTED OBJECT
 * This is not an entity
 */

export class Location {

  @Column()
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @Column()
  @IsNumber()
  @IsNotEmpty()
  lng: number;

  @Column()
  @IsNotEmpty()
  address: string;

  @Column()
  structure: number;

  @Exclude()
  public toString() {
    return this.address;
  }
}

export class TracePoint implements ITracePoint {
  @Column()
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @Column()
  @IsNumber()
  @IsNotEmpty()
  lng: number;
}

export interface ITracePoint {
  lat: number;
  lng: number;
}
