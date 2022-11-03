import express from "express";
import { addProject, deleteProject, getProject, updateProject } from "../controllers/project.js";
import { verifyToken } from "../verifyToken.js";

const router = express.Router();

//create a project
router.post("/", verifyToken, addProject);
//get all projects
//router.get("/all", signin);
router.get("/:id", verifyToken, getProject)
//router.get("/all", signin);
router.delete("/:id", verifyToken, deleteProject)
//router.get("/all", signin);
router.patch("/:id", verifyToken, updateProject)


export default router;