import "jsonwebtoken";

export interface JwtUser {
  id: number;
}

declare module "jsonwebtoken" {
  export interface JwtPayload {
    id: JwtUser.id;
    jti: string;
    type: string;
  }
}
