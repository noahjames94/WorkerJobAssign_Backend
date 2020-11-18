import { Buildable } from "@commons/decorators";
import { MetadataObj, toHexString } from "@commons";
import { Exclude, classToPlain, Transform, Expose } from "class-transformer";
import {
  getConnection,
  EntityManager,
  getRepository,
  BaseEntity,
  Repository,
  ObjectIdColumn,
  BeforeInsert,
  AfterInsert,
  ObjectID,
  Column
} from "typeorm";

import { IncrementIndex } from "@entities";

@Buildable
export class ApplicationEntity extends BaseEntity {
  protected withoutRelations = new Set<string>();

  @ObjectIdColumn()
  @Transform(toHexString, { toPlainOnly: true })
  id: ObjectID;

  @Exclude()
  @Column()
  tableId: number;

  @Expose({name: "uid"})
  get uid() {
    return this.tableId + 1;
  }

  @Exclude()
  public static tableName: string;

  @Exclude()
  private _lastestIndex?: IncrementIndex;

  @Exclude()
  tableName: string;

  @Exclude()
  async save(): Promise<this> {
    return await super.save();
  }

  @Exclude()
  getRepository = getRepository;

  @Exclude()
  assignAttributes: Function;

  @Exclude()
  validate: Function;

  constructor(
    args: MetadataObj = {},
  ) {
    super();
    const entity = <typeof ApplicationEntity>this.constructor;
    this.tableName = entity.tableName;
    Object.assign(this, args);
  }

  public toJSON(options = {}) {
    return classToPlain(this, options);
  }

  @BeforeInsert()
  async setAutoId() {
    this._lastestIndex = <IncrementIndex> await this.getRepository(IncrementIndex).findOne({ where: { entityName: this.tableName } });
    if (this._lastestIndex) {
      this.tableId = this._lastestIndex.currentIndex + 1;
    } else {
      this.tableId = 0;
    }
  }

  @AfterInsert()
  updateLastIndex() {
    if (this.tableId == 0) {
      this.getRepository(IncrementIndex).save({ "entityName": this.tableName, "currentIndex": this.tableId });
    } else if (this._lastestIndex) {
      this._lastestIndex.currentIndex += 1;
      this.getRepository(IncrementIndex).save(this._lastestIndex);
    }
  }

  @Exclude()
  get connectionManager(): EntityManager {
    return getConnection().manager;
  }

  @Exclude()
  get repository(): Repository<any> {
    return getRepository(<typeof ApplicationEntity>this.constructor);
  }


  @Exclude()
  protected set without(relation: string) {
    if (this.withoutRelations.has(relation)) {
      return;
    }
    this.withoutRelations.add(relation);
  }
}
