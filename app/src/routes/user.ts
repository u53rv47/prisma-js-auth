import express, { Request, Response } from "express";
import { PrismaClient, User } from "@prisma/client";
import { userInfo, userInput, loginUserInput, updateUserInput } from "../zod";
import { AuthenticatedRequest } from "@types";
import authenticateJwt, {
  generateToken,
  encrypt,
  decrypt,
} from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/create", async (req: Request, res: Response) => {
  console.log(req.body);
  try {
    const credentials = userInput.safeParse(req.body);
    if (!credentials.success) {
      console.log("Error while parsing the credentials:", credentials.error);
      res
        .status(400)
        .json({ message: "Invalid credentials", error: credentials.error });
    } else {
      const email = credentials.data.email;
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        res.status(403).json({ message: "User already exists" });
      } else {
        const { first_name, last_name, password } = credentials.data;
        const userData = { email, first_name, last_name };
        const newUser = await prisma.user.create({
          data: {
            ...userData,
            password: encrypt(password),
            last_login: new Date(),
          },
          select: { id: true },
        });
        const access_token = generateToken(newUser.id, "access");
        const refresh_token = generateToken(newUser.id, "refresh");
        res.json({
          message: "User created successfully",
          access_token,
          refresh_token,
          user: { id: newUser.id, ...userData },
        });
      }
    }
  } catch (err) {
    if (err)
      res.status(500).json({ message: "Something went wrong", error: err });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const credentials = loginUserInput.safeParse(req.body);
    if (!credentials.success) {
      res
        .status(400)
        .json({ message: "Invalid credentials.", error: credentials.error });
    } else {
      const { email, password } = credentials.data;
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        const decryptedPassword = decrypt(user.password);
        if (password === decryptedPassword) {
          const access_token = generateToken(user.id, "access");
          const refresh_token = generateToken(user.id, "refresh");
          res.json({
            message: "Logged in successfully.",
            access_token,
            refresh_token,
            user: Object.fromEntries(
              Object.entries(user).filter(([key]) => userInfo.includes(key))
            ),
          });
        } else res.status(400).json({ message: "Incorrect password." });
      } else
        res
          .status(400)
          .json({ message: "Incorrect username / Does not exists." });
    }
  } catch (err) {
    if (err)
      res.status(500).json({ message: "Something went wrong", error: err });
  }
});

router.get("/", authenticateJwt, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId, is_active: true },
      });
      if (user) {
        res.json({
          message: "Success",
          user: Object.fromEntries(
            Object.entries(user).filter(([key]) => userInfo.includes(key))
          ),
        });
      } else {
        res
          .status(404)
          .json({ message: "No active user found with given credentials" });
      }
    } else {
      res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    if (err)
      res.status(500).json({ message: "Something went wrong", error: err });
  }
});

router.patch(
  "/update",
  authenticateJwt,
  async (req: Request, res: Response) => {
    console.log(req.body);
    try {
      const credentials = updateUserInput.safeParse(req.body);
      if (!credentials.success) {
        console.log("Error while parsing the credentials:", credentials.error);
        res
          .status(400)
          .json({ message: "Invalid credentials", error: credentials.error });
      } else {
        const userId = (req as AuthenticatedRequest).user.id;
        const user = await prisma.user.findUnique({
          where: { id: userId, is_active: true },
        });
        if (user) {
          res.json({
            message: "Success",
            user: Object.fromEntries(
              Object.entries(user).filter(([key]) => userInfo.includes(key))
            ),
          });
        } else {
          res
            .status(404)
            .json({ message: "No active user found with given credentials" });
        }
      }
    } catch (err) {
      if (err)
        res.status(500).json({ message: "Something went wrong", error: err });
    }
  }
);

router.delete(
  "/delete",
  authenticateJwt,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const deleted = await prisma.user.update({
        where: { id: userId },
        data: { is_active: false },
      });
      if (!deleted.is_active)
        res.json({ message: "User deleted successfully" });
      else res.status(404).json({ message: "User could not be deleted" });
    } catch (err) {
      if (err)
        res.status(500).json({ message: "Something went wrong", error: err });
    }
  }
);

router.post(
  "/refresh",
  async (req: Request, res: Response) => {
    try {
      // TODO: Verify refresh_token and return access_token
      const userId = (req as AuthenticatedRequest).user.id;
      const access_token = generateToken(userId, "access");
      res.json({
        access_token,
        message: "Access token generated successfully",
      });
    } catch (err) {
      if (err)
        res.status(500).json({ message: "Something went wrong", error: err });
    }
  }
);

export default router;
