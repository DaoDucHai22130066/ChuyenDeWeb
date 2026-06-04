const {Schema} = require("mongoose");

const CategorySchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = {CategorySchema};