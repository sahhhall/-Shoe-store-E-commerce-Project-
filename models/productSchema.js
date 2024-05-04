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
  images: {
    type: Array,

    validate: [arrayLimit, "you can pass only 4 images"],
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
function arrayLimit(val) {
  return val.length <= 4;
}

module.exports = mongoose.model("Product", productSchema);
