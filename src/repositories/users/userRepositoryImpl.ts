import { UserRepository } from "./userRepository";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { User } from "@entities";
import { ApplicationRepositoryImpl } from "@repositories/applicationRepository";
import { AppStandardError } from "@commons/errors";
import { MetadataObj, TYPES } from "@commons";
import { EntityRepository, Repository, getRepository, ObjectID } from "typeorm";
import { ACTIVE, APPROVE } from "@constants";
import { Mailer, MailerImpl } from "@mails";
import { inject } from "inversify";
import { Request } from "express";
import { Pagination } from "../../paginate";
import { QueryBuilderImpl } from "../../utils/queryBuilder";
const { ObjectId } = require("mongodb").ObjectId;

@EntityRepository(User)
export class UserRepositoryImpl
  extends ApplicationRepositoryImpl<User>
  implements UserRepository {
  mailer: MailerImpl;

  users: UserRepositoryImpl;

  EntityType = User;

  private _withDeleted = false;

  constructor() {
    super();
    this.mailer = new MailerImpl();
  }

  // Do not remove this function. It's need to get deleted users from DB
  set withDeleted(value: boolean) {
    this._withDeleted = value;
  }

  async customCreate(
    args: MetadataObj = {},
    permitKeys: Array<string> = []
  ): Promise<User> {
    const { password, repeatPassword } = args;
    if (password !== repeatPassword) {
      throw new AppStandardError(
        "confirmation_password",
        "Confirmation password does not match!",
        [],
        {
          errors: [
            {
              field: "repeatPassword",
              messages: ["Confirmation password does not match!"],
            },
          ],
        }
      );
    }

    if (args.email && typeof args.email === "string") {
      args.email = args.email.toLowerCase();
    }

    return await super.customCreate(args, permitKeys);
  }

  async findByActivateToken(token: string): Promise<any> {
    return this.repository.findOne({
      activateToken: token,
      isActive: ACTIVE.inactive,
    });
  }

  async findByRestoreToken(token: string): Promise<any> {
    return this.repository.findOne({ restoreToken: token });
  }

  async generateRestoreToken(user: User): Promise<any> {
    user.restoreToken = crypto.randomBytes(16).toString("hex");
    await user.save();
    return user.restoreToken;
  }

  async restore(user: User, password: string): Promise<any> {
    user.restoreToken = "";
    user.password = bcrypt.hashSync(password, 10);
    this.repository.save(user);
  }

  async activate(user: User): Promise<any> {
    user.activateToken = "";
    user.isActive = ACTIVE.active;
    user.isApproved = APPROVE.approved;
    this.repository.save(user);
  }

  async changeEmail(
    user: User,
    email: string,
    password?: string
  ): Promise<any> {
    user.activateToken = crypto.randomBytes(16).toString("hex");
    user.isActive = ACTIVE.inactive;
    user.email = email;

    const url = `${process.env.API_HOST}/user/activate?token=${user.activateToken}`;
    // TODO: recomment this
    // this.mailer.send(user.email, { url }, "activations");
    this.mailer.send(
      email,
      { username: `${user.firstName}`, url, password },
      "activations"
    );

    return await user.save();
  }

  async findByEmailPassword(email: string, password: string): Promise<any> {
    email = email.toLowerCase();
    const emailReg = {
      email: { $regex: new RegExp(`^${email}$`), $options: "i" },
    } as any;
    const user = await this.repository.findOneOrFail(emailReg);

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      // tslint:disable-next-line: no-null-keyword
      return null;
    }
    return user;
  }

  async approve(id: string, approved: number = APPROVE.waiting): Promise<User> {
    return await this.findAndUpdate(id, { isApproved: approved });
  }

  async findById(id: string | ObjectID): Promise<User> {
    const query = { _id: ObjectId(id.toString()) } as any;
    if (!this._withDeleted) {
      // tslint:disable-next-line:no-null-keyword
      query.deletedAt = { $exists: false };
    }
    return <User>await this.repository.findOne(query);
  }

  async findByIds(ids: string[] | ObjectID[]): Promise<User[]> {
    const query = {} as any;
    if (!this._withDeleted) {
      // tslint:disable-next-line:no-null-keyword
      query.deletedAt = { $exists: false };
    }
    return <User[]>await this.repository.findByIds(ids, query);
  }

  async findOne(query: any = {}, projection: any = {}): Promise<User> {
    if (!this._withDeleted) {
      // tslint:disable-next-line:no-null-keyword
      projection.deletedAt = { $exists: false };
    }
    const result = <any | undefined>(
      await this.repository.findOne(query, projection)
    );
    return result;
  }

  async findAll(
    request: Request,
    appQuery: any = {}
  ): Promise<Pagination<User>> {
    if (!this._withDeleted) {
      // tslint:disable-next-line:no-null-keyword
      appQuery.deletedAt = { $exists: false };
    }
    const queryBuilder = new QueryBuilderImpl<User>(request, appQuery);
    const query = queryBuilder.build();
    const [results, total] = <[User[], number]>(
      await this.repository.findAndCount(query)
    );

    return new Pagination<User>({
      results,
      total,
      page: queryBuilder.page,
      limit: queryBuilder.limit,
    });
  }

  async findAllNoPaginate(appQuery: any = {}): Promise<User[]> {
    if (!this._withDeleted) {
      // tslint:disable-next-line:no-null-keyword
      appQuery.deletedAt = { $exists: false };
    }
    return this.repository.find(appQuery);
  }
}
