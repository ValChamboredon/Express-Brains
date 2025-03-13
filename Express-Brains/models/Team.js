const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    score: { type: Number, default: 0 },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model("Team", teamSchema);