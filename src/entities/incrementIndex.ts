import { Column, Entity, ObjectID, ObjectIdColumn } from "typeorm";
import { ApplicationEntity } from "./applicationEntity";
import { Transform } from "class-transformer";
import { toHexString } from "../commons";

@Entity()
export class IncrementIndex extends ApplicationEntity {
    static tableName = "incrementIndex";

    // Store tablename
    @Column()
    entityName: string;

    // Store the lastest index
    @Column()
    currentIndex: number;
}
