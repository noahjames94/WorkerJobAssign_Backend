import { injectable, inject } from "inversify";
import { Strategy } from "./strategy";
import * as express from "express";
import { TYPES } from "@commons";
import passport from "passport";
import { Strategy as LocalStrategy, } from "passport-local";
import { Strategy as JWTStrategy, ExtractJwt } from "passport-jwt";
import { getCustomRepository } from "typeorm";
import { UserRepositoryImpl } from "@repositories";

@injectable()
export class JwtStrategyImpl implements Strategy {
  users: UserRepositoryImpl;

  constructor() {
    this.users = getCustomRepository(UserRepositoryImpl);
  }

  register(app: express.Application) {
    app.use(passport.initialize());

    passport.use(new LocalStrategy({
      usernameField: "email",
      passwordField: "password"
    }, async (email, password, cb) => {
      try {
        const user = await this.users.findByEmailPassword(email, password);
        // tslint:disable-next-line: no-null-keyword
        return cb(null, user);
      } catch (error) {
        return cb(error);
      }
    }));

    passport.use(new JWTStrategy({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET
    }, async (jwtPayload, next) => {
      const { id } = jwtPayload;
      const user = await this.users.findById(id);
      if (user) {
        // tslint:disable-next-line: no-null-keyword
        return next(null, user);
      }
      // tslint:disable-next-line: no-null-keyword
      return next(null, false);
    }));
  }
}
