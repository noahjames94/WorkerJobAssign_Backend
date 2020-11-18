import { ApplicationEntity } from "entities/applicationEntity";

export interface Constructable<T> {
  new(): T;
  [key: string]: any;
}
