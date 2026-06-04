const {Schema} = require("mongoose");

const BorrowTicketSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  books: [{ type: Schema.Types.ObjectId, ref: "Book", required: true }],
  status: { type: String, enum: ["Pending", "Approved", "Returned", "Rejected"], default: "Pending" },
  borrowDate: { type: Date, default: Date.now },
  returnDate: { type: Date, default: null },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  approvedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = {BorrowTicketSchema};