const express = require('express');
const router = express.Router();
const wishlistController = require('../controller/wishlist');
const { userAuth } = require('../middlewares/userAuth');
const { checkRole } = require('../middlewares/checkRole');

router.get('/', userAuth, checkRole("user"), wishlistController.getWishlist);
router.post('/:bookId', userAuth, checkRole("user"), wishlistController.addToWishlist);
router.delete('/:bookId', userAuth, checkRole("user"), wishlistController.removeFromWishlist);

module.exports = router;
