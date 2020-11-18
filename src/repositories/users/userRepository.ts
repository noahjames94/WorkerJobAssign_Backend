import { User } from "@entities";
import { ApplicationRepository } from "@repositories/applicationRepository";

export interface UserRepository extends ApplicationRepository<User> {
  findByActivateToken(token: string): Promise<any>;
  activate(user: User): Promise<any>;
  findByEmailPassword(email: string, password: string): Promise<any>;
  approve(id: string): Promise<User>;
  changeEmail(user: User, email: string, password?: string): Promise<User>;
}
