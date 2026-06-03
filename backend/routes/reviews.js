const express = require('express');
const router = express.Router();
const reviewController = require('../controller/reviews');
const { userAuth } = require('../middlewares/userAuth');

router.post('/', userAuth, reviewController.addReview);

module.exports = router;
