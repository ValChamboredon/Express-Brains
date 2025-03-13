const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, lowercase: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" },
    attempts: { type: Number, default: 0 },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }
});

module.exports = mongoose.model("User", userSchema);