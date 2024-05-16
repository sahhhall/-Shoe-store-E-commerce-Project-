const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = mongoose.Schema({
  previous_price: {
    type: String,
    required: true,
  },

  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  sizes: {
    type: Array,
  },
  category: {
    type: String,
    required: true,
  },
  categorys: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "categories",
  },
  images: {
    type: Array,
  },
  stockQuantity: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  is_Listed: {
    type: Boolean,
    required: true,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Product", productSchema);
