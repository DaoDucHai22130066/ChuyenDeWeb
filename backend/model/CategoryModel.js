const {model} = require("mongoose");
const {CategorySchema} = require("../schemas/CategorySchema");

const CategoryModel = model("Category", CategorySchema);

module.exports = {CategoryModel};