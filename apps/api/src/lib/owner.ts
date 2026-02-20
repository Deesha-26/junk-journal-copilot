import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { env } from "./env.js";

declare global {
  namespace Express {
    interface Request {
      ownerId?: string;
    }
  }
}

export function ownerMiddleware(req: Request, res: Response, next: NextFunction) {
  const cookieName = env().COOKIE_NAME;
  let token = req.cookies?.[cookieName] as string | undefined;

  if (!token) {
    token = crypto.randomUUID();
    res.cookie(cookieName, token, { httpOnly: true, sameSite: "lax" });
  }

  req.ownerId = token;
  next();
}
