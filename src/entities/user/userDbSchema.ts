import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, Unique } from "typeorm";
@Entity("Users")
@Unique(["username", "email"])

export class UserDbSchema {
  @PrimaryGeneratedColumn("uuid")
  public _id: string;
  @Column({ nullable: true })
  public fistName: string;
  @Column({ nullable: true })
  public lastName: string;
  @Column()
  public userName: string;
  @Column()
  public passWord: string;
  @Column()
  public email: string;
  @Column({ nullable: true })
  public refferalCode: string;
  @Column({ nullable: true })
  public lastLogin: Date;
  @Column()
  public loginCount: number;
  @Column()
  public emailVerified: boolean;
  @Column()
  public phoneNumber: string;
  @Column({ nullable: true })
  public phoneConfirmed: boolean;
  @Column({ nullable: true })
  public twoFactorEnabled: boolean;
  @Column()
  public active: boolean;
  @Column()
  public created: Date;
  @BeforeInsert()
  setDefault() {
    this.active = true;
    this.loginCount = 0;
    this.created = new Date();
  }
}
