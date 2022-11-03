import express from "express";
import { signup,signin,verify, logout } from "../controllers/auth.js";

const router = express.Router();

//create a user
router.post("/signup", signup);
//signin
router.post("/signin", signin);
//verify
router.get("/verify/:token", verify);
//logout
router.post("/logout", logout);


export default router;