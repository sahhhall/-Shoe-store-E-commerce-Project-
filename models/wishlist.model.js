const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  products: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  ],
});

module.exports = mongoose.model("Wishlist", wishlistSchema);

