import { HashData } from "./hashData";
import { injectable } from "inversify";
import bcrypt from "bcryptjs";

@injectable()
export class HashDataImpl implements HashData {
  saltRound: number = 10;

  passWord(userId: string, passWord: string): any {
    const hash = bcrypt.hashSync(passWord, this.saltRound);

    return hash;
  }

  validPassword(userId: string, passWord: string, hash: string): any {
    const valid = bcrypt.compareSync(passWord, hash);

    return valid;
  }
}
