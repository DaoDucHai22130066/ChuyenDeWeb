const express = require("express");
const router = express.Router();
const { ticketController } = require("../controller/tickets");
const { userAuth } = require("../middlewares/userAuth");
const { checkRole } = require("../middlewares/checkRole");

router.post("/", userAuth, checkRole("user"), ticketController.createTicket);
router.get("/me", userAuth, checkRole("user"), ticketController.getMyTickets);
router.get("/vnpay/return", ticketController.vnpayReturn);
router.get("/vnpay/ipn", ticketController.vnpayIpn);
router.get("/", userAuth, checkRole("admin"), ticketController.getAllTickets);
router.get("/:id/transactions", userAuth, checkRole("admin"), ticketController.getTicketTransactions);
router.put("/:id/status", userAuth, checkRole("admin"), ticketController.updateTicketStatus);
router.post("/:id/cancel", userAuth, checkRole("user"), ticketController.cancelMyTicket);
// Allow both regular users and admins to call renew endpoint; renewTicket will enforce ownership/admin rules
router.post("/:id/renew", userAuth, checkRole(["user", "admin"]), ticketController.renewTicket);
router.get("/:id/renewals", userAuth, ticketController.getTicketRenewals);

module.exports = router;
