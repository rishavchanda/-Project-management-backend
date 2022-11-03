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
        required: true,
    },
    img: {
        type: String,
    },
    verified: {
        type: Boolean,
        required: true,
        default: false,
    },
    projects: {
        type: [String],
        default: [],
    },
    notifications: {
        type: [{
            notification: {
                type: String,
                required: true,
            },
            link: {
                type: String,
            }
        }],
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