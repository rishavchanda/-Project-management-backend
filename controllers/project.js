import mongoose from "mongoose";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import { createError } from "../error.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from 'dotenv';
import Project from "../models/Project.js";
import Works from "../models/Works.js";
import Tasks from "../models/Tasks.js";
import Notifications from "../models/Notifications.js";


export const addProject = async (req, res, next) => {
  const user = await User.findOne({ id: req.user.id });
  if (!user) {
    return next(createError(404, "User not found"));
  }
  if (!user.verified) {
    return res.status(200).json({ message: "Verify your Account." });
  }
  const newProject = new Project({ members: [{ id: user.id, img: user.img, email: user.email, name: user.name, role: "d", access: "Owner" }], ...req.body });
  try {
    const saveProject = await (await newProject.save());
    User.findByIdAndUpdate(user.id, { $push: { projects: saveProject._id } }, { new: true }, (err, doc) => {
      if (err) {
        next(err);
      }
    });
    res.status(200).json(saveProject);
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
          User.findByIdAndUpdate(req.user.id, { $pull: { projects: req.params.id } }, { new: true }, (err, doc) => {
            if (err) {
              next(err);
            }
          });
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
    const members = []
    var verified = false
    await Promise.all(
      project.members.map(async (Member) => {
        console.log(Member.id)
        if (Member.id === req.user.id) {
          verified = true
        }
        await User.findById(Member.id).then((member) => {
          console.log(member)
          members.push({ id: member.id, role: Member.role, access: Member.access, name: member.name, img: member.img, email: member.email });
        })
      })
    )
      .then(() => {
        if (verified) {
          return res.status(200).json({ project, members });
        } else {
          return next(createError(403, "You are not allowed to view this project!"));
        }
      });

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



dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  },
  port: 465,
  host: 'smtp.gmail.com'
});

export const inviteProjectMember = async (req, res, next) => {
  //send mail using nodemailer
  const user = await User.findOne({ id: req.user.id });
  if (!user) {
    return next(createError(404, "User not found"));
  }
  if (!user.verified) {
    return res.status(200).json({ message: "Verify your Account." });
  }
  const project = await Project.findById(req.params.id);
  if (!project) return next(createError(404, "Project not found!"));
  for (let i = 0; i < project.members.length; i++) {
    if (project.members[i].id === req.user.id) {
      if (project.members[i].access === "Owner" || project.members[i].access === "Admin" || project.members[i].access === "Editor") {

        const mailOptions = {
          from: process.env.EMAIL,
          to: req.body.email,
          subject: "Invitation to join project",
          text: `Hi ${req.body.name}, you have been invited to join project ${project.title} by ${user.name}. Please click on the link to join the project. http://localhost:8080/api/project/invite/${req.params.id}/${req.body.id}`,
        };
        transporter.sendMail(mailOptions, (err, data) => {
          if (err) {
            return next(err);
          } else {
            res.status(200).json({ message: "Email sent successfully" });
          }
        });
      } else {
        return next(createError(403, "You are not allowed to invite members to this project!"));
      }
    }
  }
};

//verify invitation and add to project member
export const verifyInvitation = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return next(createError(404, "Project not found!"));
    const user = await User.findById(req.params.userId);
    if (!user) {
      return next(createError(404, "User not found"));
    }
    if (!user.verified) {
      return res.status(200).json({ message: "Verify your Account." });
    }
    for (let i = 0; i < project.members.length; i++) {
      if (project.members[i].id === user.id) {
        return next(createError(403, "You are already a member of this project!"));
      }
    }
    const newMember = { id: user.id, img: user.img, name: user.name, email: user.email, role: "d", access: "View Only" };
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.projectId,
      {
        $push: { members: newMember },
      },
      { new: true }
    );
    User.findByIdAndUpdate(user.id, { $push: { projects: updatedProject._id } }, { new: true }, (err, doc) => {
      if (err) {
        next(err);
      }
    });
    res.status(200).json(updatedProject);
  } catch (err) {
    next(err);
  }
};


export const getProjectMembers = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(createError(404, "Project not found!"));
    res.status(200).json(project.members);
  } catch (err) {
    next(err);
  }
}

//add works to project
export const addWork = async (req, res, next) => {
  try {

    const user = await User.findOne({ id: req.user.id });
    const project = await Project.findById(req.params.id);
    if (!project) return next(createError(404, "Project not found!"));
    for (let i = 0; i < project.members.length; i++) {
      if (project.members[i].id === req.user.id) {
        if (project.members[i].access === "Owner" || project.members[i].access === "Admin" || project.members[i].access === "Editor") {

          //create tasks from the arrya of tasks or req.body.tasks and thne push the id of the tasks to the work

          const tasks = [];
          for (let i = 0; i < req.body.tasks.length; i++) {
            const newTask = new Tasks({
              ...req.body.tasks[i],
              task: req.body.tasks[i].task,
              start_date: req.body.tasks[i].start_date,
              end_date: req.body.tasks[i].end_date,
              members: req.body.members,
              projectId: project._id,
            });
            const task = await newTask.save();
            tasks.push(task.id);
          }

          const newWork = new Works({
            ...req.body,
            title: req.body.title,
            desc: req.body.desc,
            priority: req.body.priority,
            tags: req.body.tags,
            projectId: project._id,
            creatorId: user.id,
            tasks: tasks,
          });
          const work = await newWork.save();

          // add the work id to the tasks
          for (let i = 0; i < tasks.length; i++) {
            Tasks.findByIdAndUpdate(tasks[i], { workId: newWork._id }, (err, doc) => {
              if (err) {
                next(err);
              }
            });
          }

          // add the work id to the project
          const updatedProject = await Project.findByIdAndUpdate(
            req.params.id,
            {
              $push: { works: work._id },
            },
            { new: true }
          ).then(() => {
            //add the work id to the members and the tasks
            for (let k = 0; k < req.body.tasks.length; k++) {
              for (let i = 0; i < req.body.tasks[k].members.length; i++) {
                const user = User.findByIdAndUpdate(req.body.tasks[k].members[i], { $push: { works: work._id } }, (err, doc) => {
                  if (err) {
                    next(err);
                  }
                });

                for (let i = 0; i < tasks.length; i++) {
                  User.findByIdAndUpdate(req.body.tasks[k].members[i], { $push: { tasks: tasks[i] } }, (err, doc) => {
                    if (err) {
                      next(err);
                    }
                  }
                  );
                }
              }

            }
          });
          for (let k = 0; k < req.body.tasks.length; k++) {
            for (let i = 0; i < req.body.tasks[k].members.length; i++) {
              const newNotification = new Notifications({
                link: project.id,
                type: "task",
                message: `"${user.name}" added you to task "${req.body.tasks[k].task}" in work "${work.title}" in project "${project.title.toUpperCase()}".`,
              });
              const notification = await newNotification.save();

              console.log(notification);
              User.findByIdAndUpdate(req
                .body.tasks[k].members[i], { $push: { notifications: notification._id } }, (err, doc) => {
                  if (err) {
                    next(err);
                  }
                }
              );
            }
          }
          res.status(200).json(updatedProject);
        } else {
          return next(createError(403, "You are not allowed to add work to this project!"));
        }
      }
    }
  } catch (err) {
    next(err);
  }
};