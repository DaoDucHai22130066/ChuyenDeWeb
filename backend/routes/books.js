const express = require("express");
const  router = express.Router();
const {booksController} = require("../controller/books")
const {userAuth} = require("../middlewares/userAuth");
const {checkRole} = require("../middlewares/checkRole");
const {upload} = require("../utils/cloudConfig");

router.post("/add",userAuth,checkRole("admin"),upload.single("coverImage"),booksController.addNewBook)

router.get("/",booksController.getAllBooks)
router.get("/new",booksController.getLatestBooks)
router.get("/:id",booksController.getParticularBook)
router.delete("/delete/:id",userAuth,checkRole("admin"),booksController.deleteBook)
router.put("/update/:id",userAuth,checkRole("admin"),booksController.updateBook)




module.exports = router 