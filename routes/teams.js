import mongoose from "mongoose";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import { createError } from "../error.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from 'dotenv';
import Teams from "../models/Teams.js";


export const addTeam = async (req, res, next) => {
  const user = await User.findOne({ id: req.user.id });
  if (!user) {
    return next(createError(404, "User not found"));
  }
  if (!user.verified) {
    return res.status(200).json({ message: "Verify your Account." });
  }
  const newTeams = new Teams({ members: [{ id: user.id, role: "d", access: "Owner" }], ...req.body });
  try {
    const saveTeams = await (await newTeams.save());
    User.findByIdAndUpdate(user.id, { $push: { projects: saveTeams._id } }, { new: true }, (err, doc) => {
      if (err) {
        next(err);
      }
    });
    res.status(200).json(saveTeams);
  } catch (err) {
    next(err);
  }
};


export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(createError(404, "Project not found!"));
    for (let i = 0; i < project.members.length; i++) {
      if (project.members[i].id === req.user.id) {
        if (project.members[i].access === "Owner") {
          await project.delete();
          res.status(200).json("Project has been deleted...");
        } else {
          return next(createError(403, "You are not allowed to delete this project!"));
        }
      }
    }
  } catch (err) {
    next(err);
  }
};

export const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    res.status(200).json(project);
  } catch (err) {
    next(err);
  }
};


export const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(createError(404, "project not found!"));
    for (let i = 0; i < project.members.length; i++) {
      if (project.members[i].id === req.user.id) {
        if (project.members[i].access === "Owner" || project.members[i].access === "Admin" || project.members[i].access === "Editor") {
          const updatedproject = await Project.findByIdAndUpdate(
            req.params.id,
            {
              $set: req.body,
            },
            { new: true }
          );
          res.status(200).json(updatedproject);
        } else {
          return next(createError(403, "You are not allowed to update this project!"));
        }
      } else {
        return next(createError(403, "You can update only if you are a member of this project!"));
      }
    }
  } catch (err) {
    next(err);
  }
};