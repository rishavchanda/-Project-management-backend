import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import projectRoutes from './routes/project.js';
import teamRoutes from './routes/teams.js';
import cookieParser from "cookie-parser";
import cors from 'cors';
const app = express();
dotenv.config();

const port = process.env.PORT || 8800;

const connect = () => {
    mongoose.connect(process.env.MONGO_URL).then(() => {
        console.log('MongoDB connected');
    }).catch((err) => {
        console.log(err);
    });
};


app.use(cookieParser())
app.use(express.json())
app.use(cors())
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/project", projectRoutes)
app.use("/api/team", teamRoutes)
app.use((err, req, res, next)=>{
    const status = err.status || 500;
    const message = err.message || "Something went wrong";        
    return res.status(status).json({
        success: false,
        status,
        message
    })
})

app.listen(port,()=>{
    console.log("Connected")
    connect();
})