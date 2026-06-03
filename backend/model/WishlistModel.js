const { model } = require("mongoose");
const { WishlistSchema } = require("../schemas/WishlistSchema");

const WishlistModel = new model("Wishlist", WishlistSchema);

module.exports = { WishlistModel };
