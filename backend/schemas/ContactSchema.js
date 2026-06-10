const {Schema} = require("mongoose");

const ContactSchema = new Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  status: {
    type: String,
    enum: ["new", "in_progress", "resolved", "closed"],
    default: "new",
  },
  adminNote: String,
  handledBy: String,
  handledAt: Date,
  date: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

module.exports = {ContactSchema};
