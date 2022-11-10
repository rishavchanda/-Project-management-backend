import express from "express";
import {
  update,
  deleteUser,
  getUser,
  subscribe,
  unsubscribe,
  getUserProjects,
  getUserTeams,
  findUser
} from "../controllers/user.js";
import { verifyToken } from "../verifyToken.js";

const router = express.Router();

//update user
router.put("/:id", verifyToken, update);

//delete user
router.delete("/:id", verifyToken, deleteUser);

//get a user
router.get("/find/:id",verifyToken, findUser);
router.get("/find",verifyToken, getUser);

//subscribe a user
router.put("/sub/:id", verifyToken, subscribe);

//unsubscribe a user
router.put("/unsub/:id", verifyToken, unsubscribe);

//get user projects
router.get("/projects", verifyToken, getUserProjects);

//get user teams
router.get("/teams", verifyToken, getUserTeams);


export default router;