import { createError } from "../error.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Teams from "../models/Teams.js";
import Notifications from "../models/Notifications.js";

export const update = async (req, res, next) => {
  if (req.params.id === req.user.id) {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        { new: true }
      );
      res.status(200).json(updatedUser);
    } catch (err) {
      next(err);
    }
  } else {
    return next(createError(403, "You can update only your account!"));
  }
}

export const deleteUser = async (req, res, next) => {
  if (req.params.id === req.user.id) {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json("User has been deleted.");
    } catch (err) {
      next(err);
    }
  } else {
    return next(createError(403, "You can delete only your account!"));
  }
}

export const findUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

export const getUser = async (req, res, next) => {
  //if the req.user id is not present then it will give a message of user not authenticated 

  try {
    const user = await User.findById(req.user.id).populate("notifications").populate({
      path: "teams",
      populate: {
        path: "members.id",
        select: "_id name email",
      }
    }).populate("projects").populate("works").populate("tasks");
    //extract the notification from the user and send it to the client
    console.log(user)
    res.status(200).json(user);
  } catch (err) {
    console.log(req.user)
    next(err);
  }
}

// get notifications of the user

export const getNotifications = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    //extract the notification from the user and send it to the client
    const notifications = user.notifications;
    const notificationArray = [];
    for (let i = 0; i < notifications.length; i++) {
      const notification = await Notifications.findById(notifications[i]);
      notificationArray.push(notification);
    }
    res.status(200).json(notificationArray);
  } catch (err) {
    next(err);
  }
}


export const subscribe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $push: { subscribedUsers: req.params.id },
    });
    await User.findByIdAndUpdate(req.params.id, {
      $inc: { subscribers: 1 },
    });
    res.status(200).json("Subscription successfull.")
  } catch (err) {
    next(err);
  }
}

export const unsubscribe = async (req, res, next) => {
  try {
    try {
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { subscribedUsers: req.params.id },
      });
      await User.findByIdAndUpdate(req.params.id, {
        $inc: { subscribers: -1 },
      });
      res.status(200).json("Unsubscription successfull.")
    } catch (err) {
      next(err);
    }
  } catch (err) {
    next(err);
  }
}

//find project id from user and get it from projects collection and send it to client
export const getUserProjects = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("projects")
    const projects = []
    await Promise.all(user.projects.map(async (project) => {
      await Project.findById(project).then((project) => {
        projects.push(project)
      }).catch((err) => {
        next(err)
      })
    })).then(() => {
      res.status(200).json(projects)
    }).catch((err) => {
      next(err)
    })
  } catch (err) {
    next(err);
  }
}

//find team id from user and get it from teams collection and send it to client
export const getUserTeams = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("teams")
    const teams = []
    await Promise.all(user.teams.map(async (team) => {
      await Teams.findById(team.id).then((team) => {
        teams.push(team)
      }).catch((err) => {
        next(err)
      })
    })).then(() => {
      res.status(200).json(teams)
    }).catch((err) => {
      next(err)
    })
  } catch (err) {
    next(err);
  }
}

//find user from email and send it to client
export const findUserByEmail = async (req, res, next) => {
  const email = req.params.email;
  const users = [];
  try {
    await User.findOne({ email: { $regex: email, $options: "i" } }).then((user) => {
      users.push(user)
    }).catch((err) => {
      next(err)
    })
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
}