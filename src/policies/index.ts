import acl from "acl";
import * as express from "express";
import { getRoleById } from "../constants";
import { EROLES } from "@constants";

const memoryBackendAcl = new acl(new acl.memoryBackend());

export const invokePolicies = () => {
  memoryBackendAcl.allow([
    {
      roles: [`${EROLES.superadmin}`],
      allows: [
        {
          resources: "/roles",
          permissions: "*"
        },
        {
          resources: "/workers",
          permissions: "*"
        }
      ]
    }
  ]);
};

export const isAllowed = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  let roles: string[] = [];
  if (!req.user) {
    roles = ["guest"];
  } else {
    req.user.roles.forEach((role: number) => {
      roles.push(getRoleById(role).role);
    });
  }

  memoryBackendAcl.areAnyRolesAllowed(roles, req.baseUrl, req.method.toLowerCase(), (err, isAllowed) => {
    if (err) {
      return res.status(500).send("Unexpected authorization error");
    } else {
      if (isAllowed) {
        return next();
      } else {
        return res.status(403).end();
      }
    }
  });
};
