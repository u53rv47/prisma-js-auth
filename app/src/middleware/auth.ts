if (!process.env.JWT_SECRET || !process.env.PASS_KEY)
  throw new Error("Secrets missing from environment variables");

import jwt from "jsonwebtoken";
import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from "uuid";
import { Request, Response, NextFunction } from "express";
import { User } from "@prisma/client";
import { AuthenticatedRequest } from "@types";

const REFRESH_TOKEN_EXPIRY = "1d";
const ACCESS_TOKEN_EXPIRY = "7d";
const JWT_SECRET = process.env.JWT_SECRET as string;
const PASS_KEY = process.env.PASS_KEY as string;

export function encrypt(password: string): string {
  return CryptoJS.AES.encrypt(password, PASS_KEY).toString();
}

export function decrypt(hash: string): string {
  return CryptoJS.AES.decrypt(hash, PASS_KEY).toString(CryptoJS.enc.Base64);
}

export function generateToken(id: User["id"], tokenType: string): string {
  return jwt.sign({ id, jti: uuidv4(), type: tokenType }, JWT_SECRET, {
    expiresIn:
      tokenType === "refresh" ? REFRESH_TOKEN_EXPIRY : ACCESS_TOKEN_EXPIRY,
  });
}

function authenticateJwt(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token: string = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (err, payload) => {
      if (err || !payload || typeof payload === "string") {
        res.status(403).send({ message: "Invalid token / Expired" });
        return;
      }
      (req as AuthenticatedRequest).user = { id: payload.id };
      next();
    });
  } else {
    res.status(401).send({ message: "Invalid request" });
  }
}

export default authenticateJwt;
