const Wishlist = require("../models/wishlist.model");

const loadWishlistPage = async (req, res) => {
  try {
    const userId = req.session.user._id;
    console.log(userId)
    const wishlist = await Wishlist.findOne({ userId: userId }).populate("products").exec();
    console.log("its whishlisst", wishlist)
    const wishlistCount = wishlist?.products?.length;

    res.render("wishlistProfile", {
      wishlistCount,
      wishlist,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "internal server error" });
  }
};
const addToWishList = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.json({
        login: true,
        message: "Please login and continue shopping!",
      });
    }

    const { productId } = req.body;
    const userId = req.session.user._id;
    const checkWishlist = await Wishlist.findOne({ userId });
    if (!checkWishlist) {
      const newWishlist = await new Wishlist({
        userId,
        products: [productId],
      }).save();
      return res.status(200).json({ status: false });
    }
    const exist = checkWishlist.products.find((product) => {
      return product.equals(productId);
    });
    if (exist) {
      return res.status(200).json({
        status: true,
      });
    }
    const updatedWishList = await Wishlist.findOneAndUpdate(
      { userId },
      {
        $addToSet: {
          products: productId,
        },
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      status: false,
      wishlistCount: updatedWishList.products.length,
    });
  } catch (err) {
    console.error("Error adding item to wishlist:", err);
    return res.status(500).json({ message: "Error adding item to wishlist" });
  }
};
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.user._id;
    const updatedWishList = await Wishlist.findOneAndUpdate(
      { userId },
      {
        $pull: {
          products: productId,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      status: true,
    });
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  addToWishList,
  loadWishlistPage,
  removeFromWishlist,
};
