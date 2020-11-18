import * as express from "express";

export interface Strategy {
  register(app: express.Application): void;
}
