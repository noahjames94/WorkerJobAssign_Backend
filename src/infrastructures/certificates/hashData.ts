export interface HashData {
  passWord(userId: string, passWord: string): any;
  validPassword(userId: string, passWord: string, hash: string): any;
}
