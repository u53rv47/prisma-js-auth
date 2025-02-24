import express from "express";
import cors from "cors";
import userRouter from "./routes/user";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/user", userRouter);

app.listen(8000, () => {
  console.log("TrueMiles is running on port 8000");
});
