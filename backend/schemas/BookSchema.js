const {Schema} = require("mongoose");

const BookSchema = new Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    isbn: { type: String, unique: true, required: true },
    description: { type: String, required: true },
    availableCopies: { type: Number, required: true },
    totalCopies: { type: Number, required: true },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User',required: true },
    coverImage: { type: String },
    price: {type:Number},
    branch: { type: String, enum: ['dai-la', 'cau-giay'], default: 'dai-la' },
    borrowCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
}) 

module.exports = {BookSchema};