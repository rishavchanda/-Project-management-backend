import mongoose from "mongoose";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import { createError } from "../error.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from 'dotenv';


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

export const signup = async (req, res) => {
    const { email } = req.body
    // Check we have an email
    if (!email) {
       return res.status(422).send({ message: "Missing email." });
    }
    try{
       // Check if the email is in use
       const existingUser = await User.findOne({ email }).exec();
       if (existingUser) {
          return res.status(409).send({ 
                message: "Email is already in use."
          });
        }
       // Step 1 - Create and save the userconst salt = bcrypt.genSaltSync(10);
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(req.body.password, salt);
        const newUser = new User({ ...req.body, password: hashedPassword });
        // Step 2 - Generate a verification token with the user's ID
        const verificationToken = newUser.generateVerificationToken();
        // Step 3 - Email the user a unique verification link
        const url = `http://localhost:8080/api/auth/verify/${verificationToken}`
        transporter.sendMail({
          to: email,
          subject: 'Verify Account',
          html: `Click <a href = '${url}'>here</a>  to confirm your email.`
        },(err)=>{
            if(err){
                next(err)
            }else{      
                newUser.save();
                res.status(200).json({meaage: `Sent a verification email to ${email}`});
            }
        })
   } catch(err){
       next(err);
   }
}

export const signin = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return next(createError(404, "User not found"));
        }
        const validPassword = await bcrypt.compareSync(req.body.password, user.password);
        if (!validPassword) {
            return next(createError(400, "Wrong password"));
        }
        // Step 2 - Ensure the account has been verified
        if(!user.verified){
             return res.status(200).json({message: "Verify your Account."});
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT);
        const { password, ...others } = user._doc;
        res.cookie("access_token", token, { httpOnly: true }).status(200).json(others);
    } catch (err) {
        next(err);
    }
}


export const verify = async (req, res) => {
    const { token } = req.params
    // Check we have an id
    if (!token) {
        return res.status(422).send({ 
             message: "Missing Token" 
        });
    }
    // Step 1 -  Verify the token from the URL
    let payload = null
    try {
        payload = jwt.verify(
           token,
           process.env.USER_VERIFICATION_TOKEN_SECRET
        );
    } catch (err) {
        return res.status(500).send(err);
    }
    try{
        // Step 2 - Find user with matching ID
        const user = await User.findOne({ _id: payload.ID }).exec();
        if (!user) {
           return res.status(404).send({ 
              message: "User does not  exists" 
           });
        }
        // Step 3 - Update user verification status to true
        user.verified = true;
        await user.save();
        return res.status(200).send({
              message: "Account Verified"
        });
     } catch (err) {
        return res.status(500).send(err);
     }
}

export const logout = (req, res) => {
    res.clearCookie("access_token").json({ message: "Logged out" });
}