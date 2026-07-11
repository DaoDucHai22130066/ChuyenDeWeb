const express = require('express');
const router = express.Router();
const { cartController } = require('../controller/cart');
const { userAuth } = require('../middlewares/userAuth');
const { checkRole } = require('../middlewares/checkRole');

router.get('/', userAuth, checkRole("user"), cartController.getCart);
router.post('/save', userAuth, checkRole("user"), cartController.saveCart);
router.post('/clear', userAuth, checkRole("user"), cartController.clearCart);

module.exports = router;
