import { NextFunction, Request, Response } from "express";

type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export const asyncHandler =
  (controller: AsyncController) =>
  (req: Request, res: Response, next: NextFunction) => {
    void controller(req, res, next).catch(next);
  };

