const { Schema } = require("mongoose");

const WishlistSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    createdAt: { type: Date, default: Date.now }
});

// Prevent duplicate entries for the same user and book
WishlistSchema.index({ userId: 1, bookId: 1 }, { unique: true });

module.exports = { WishlistSchema };
