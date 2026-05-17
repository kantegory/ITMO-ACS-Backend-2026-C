import { JwtPayload } from "jsonwebtoken";
import { Request } from "express";

export type TokenPayload = JwtPayload & {
  sub: string;
  type: string;
  email: string;
};

export type AuthRequest = Request & {
  user?: TokenPayload;
};
