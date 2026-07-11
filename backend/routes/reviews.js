const express = require('express');
const router = express.Router();
const reviewController = require('../controller/reviews');
const { userAuth } = require('../middlewares/userAuth');
const { checkRole } = require('../middlewares/checkRole');

router.post('/', userAuth, checkRole("user"), reviewController.addReview);

module.exports = router;
