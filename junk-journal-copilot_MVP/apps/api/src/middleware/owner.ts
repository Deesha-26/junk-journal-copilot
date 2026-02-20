import type { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { loadEnv } from "../lib/env.js";
import { randomToken, sha256Hex } from "../lib/crypto.js";

const prisma = new PrismaClient();
const env = loadEnv();

declare global {
  namespace Express {
    interface Request {
      ownerId?: string;
    }
  }
}

const SESSION_DAYS = 365;

function cookieSecure(): boolean {
  return env.COOKIE_SECURE.toLowerCase() === "true";
}

export async function ownerMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[env.COOKIE_NAME] as string | undefined;

  if (token) {
    const tokenHash = sha256Hex(token);
    const session = await prisma.ownerSession.findUnique({ where: { tokenHash } });
    if (session && !session.revokedAt && session.expiresAt > new Date()) {
      await prisma.ownerSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
      req.ownerId = session.ownerId;
      return next();
    }
  }

  const newToken = randomToken(32);
  const tokenHash = sha256Hex(newToken);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  const owner = await prisma.owner.create({ data: { noTraining: true } });
  await prisma.ownerSession.create({ data: { ownerId: owner.id, tokenHash, expiresAt } });

  res.cookie(env.COOKIE_NAME, newToken, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    expires: expiresAt,
  });

  req.ownerId = owner.id;
  return next();
}
