import type { NextFunction, Request, RequestHandler, Response } from "express";

// Express 4 doesn't await async handlers itself — an unhandled rejection
// would otherwise hang the request instead of reaching the error middleware.
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
