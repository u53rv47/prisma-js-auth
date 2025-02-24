import * as z from "zod";

export const userInfo = ["id", "email", "first_name", "last_name"];

export const userInput = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Invalid email address" }),

  first_name: z
    .string({ required_error: "First name is required" })
    .min(3, "First name must be at least 3 characters long"),

  last_name: z
    .string({ required_error: "Last name is required" })
    .min(3, "Last name must be at least 3 characters long"),

  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one digit."
    ),
});

export const loginUserInput = userInput.pick({ email: true, password: true });
export const updateUserInput = userInput.partial();

// export type SignupParams = z.infer<typeof signupInput>;
// export type SigninParams = z.infer<typeof signinInput>;
// export type UserParams = z.infer<typeof userInput>;
