import mongoose from "mongoose";

const WorksSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: false,
    },
    desc: {
        type: String,
        required: true,
        unique: false,
    },
    tags: {
        type: [String],
        default: [],
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    endDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    status: {
        type: String,
        required: true,
        default: "Working",
    },
    members: {
        type: [{
            _id: false,
            id: {
                type: String,
                required: true,
            },
            img: {
                type: String,
                default: "",
            },
            role: {
                type: String,
                required: true,
            }
        }],
        required: true,
        default: [],
    },
},
    { timestamps: true }
);

export default mongoose.model("Works", WorksSchema);