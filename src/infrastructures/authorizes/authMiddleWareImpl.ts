import { Request, Response, NextFunction } from "express";
import { AuthMiddleWare } from "./authMiddleWare";
import { injectable } from "inversify";

@injectable()
export class AuthMiddleWareImpl implements AuthMiddleWare {
  jwt = require("jsonwebtoken");
  config = require("../../../tokenKey.json");

  // this function use genarate jwt access_token
  async GenarateToken(id: string): Promise<any> {

    const token = this.jwt.sign({ userId: id }, this.config.jwtkey);
    // let token = this.jwt.sign({
    //     data: id,
    // }, this.config.jwtkey, { expiresIn: '1h' });
    return token;
  }

  async GenarateRefreshToken() {
  }

  public Authorize() {
    const authorizationKey: string = "Bearer ";
    return function (req: Request, res: Response, next: NextFunction) {
      if (!req.headers.authorization || req.headers.authorization == "") {
        return res.status(403).json({ error: "No credentials sent!" });
      }
      else {
        const bearerToken: string = req.headers.authorization;

        let token: string = "";
        if (bearerToken.startsWith(authorizationKey)) {
          token = bearerToken.slice(authorizationKey.length, bearerToken.length);
        }

        this.jwt.verify(token, this.config.jwtkey, (err, decoded) => {
          if (err) {
            return res.status(401).json({
              success: false,
              message: "Invalid token"
            });
          } else {
            req.payload = decoded;
            next();
          }
        });
      }
    };
  }
}

