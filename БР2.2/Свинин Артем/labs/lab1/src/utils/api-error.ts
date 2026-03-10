import { Response } from "express";

export const sendApiError = (
  res: Response,
  status: number,
  message: string
) => {
  res.status(status).json({
    code: status,
    message,
  });
};

