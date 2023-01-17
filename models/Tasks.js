import mongoose from "mongoose";

const TasksSchema = new mongoose.Schema({
    projectId: {
        type: String,
        required: true,
        unique: false,
    },
    workId: { type: String, unique: false },
    task: { type: String, required: true },
    start_date: { type: String, required: true, default: "" },
    end_date: { type: String, required: true, default: "" },
    members: {
        type: [String],
        default: [],
    },
    status: { type: String, default: "Working" },
},
    { timestamps: true }
);

export default mongoose.model("Tasks", TasksSchema);