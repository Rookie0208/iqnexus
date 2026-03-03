import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
    {
    email: { 
        type: String, 
        required: true, 
        unique: true,
    },
    password: { 
        type: String, 
        required: true,
    },
    // Role-based access control
    role: {
        type: String,
        enum: ["admin", "superadmin"],
        default: "admin",
    },
    // Display name
    name: {
        type: String,
        default: "",
    },
    // Whether account is active
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema, "admin-db");

export {Admin}