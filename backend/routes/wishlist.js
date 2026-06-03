const express = require('express');
const router = express.Router();
const wishlistController = require('../controller/wishlist');
const { userAuth } = require('../middlewares/userAuth');

router.get('/', userAuth, wishlistController.getWishlist);
router.post('/:bookId', userAuth, wishlistController.addToWishlist);
router.delete('/:bookId', userAuth, wishlistController.removeFromWishlist);

module.exports = router;
