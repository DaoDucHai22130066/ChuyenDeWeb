const {model} = require("mongoose");
const {BorrowTicketSchema} = require("../schemas/BorrowTicketSchema");

const BorrowTicketModel = model("BorrowTicket", BorrowTicketSchema);

module.exports = {BorrowTicketModel};