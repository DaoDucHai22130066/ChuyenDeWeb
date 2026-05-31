const express = require('express');
const router = express.Router();
const { cartController } = require('../controller/cart');
const { userAuth } = require('../middlewares/userAuth');

router.get('/', userAuth, cartController.getCart);
router.post('/save', userAuth, cartController.saveCart);
router.post('/clear', userAuth, cartController.clearCart);

module.exports = router;
