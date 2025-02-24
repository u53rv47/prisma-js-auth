import { Request } from "express";
import { JwtUser } from "./auth";

export interface AuthenticatedRequest extends Request {
  user: JwtUser;
}
