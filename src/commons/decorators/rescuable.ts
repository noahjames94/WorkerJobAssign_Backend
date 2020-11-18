import * as express from "express";

export function rescuable(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  if (!target.rescuableHandlers) target.rescuableHandlers = {};
  async function rescuableHandler(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    ...args: Array<any>
  ) {
    try {
      return await descriptor.value.bind(this)(req, res, next, target, ...args);
    } catch (error) {
      next(error);
    }
  }

  target.rescuableHandlers[propertyKey] = rescuableHandler;
  return descriptor;
}
