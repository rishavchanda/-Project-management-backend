import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: false,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        default: "",
    },
    img: {
        type: String,
        default: "",
    },
    verified: {
        type: Boolean,
        required: true,
        default: false,
    },
    googleSignIn:{
        type: Boolean,
        required: true,
        default: false,
    },
    projects: {
        type: [String],
        default: [],
    },
    teams: {
        type: [{
            _id:false,
            id: {
                type: String,
                required: true
            },
            name: {
                type: String,
                required: true
            }
        }],
        default: [],
    },
    notifications: {
        type: [String],
        default: [],
    },
    works: {
        type: [String],
        default: [],
    },
    tasks: {
        type: [String],
        default: [],
    }
},
    { timestamps: true }
);

UserSchema.methods.generateVerificationToken = function () {
    const user = this;
    const verificationToken = jwt.sign(
        { ID: user._id },
        process.env.USER_VERIFICATION_TOKEN_SECRET,
        { expiresIn: "7d" }
    );
    return verificationToken;
};

export default mongoose.model("User", UserSchema);