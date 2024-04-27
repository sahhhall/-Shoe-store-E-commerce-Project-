const Wishlist = require("../models/wishlist.model");

const loadWishlistPage = async (req, res) => {
  try {
    const { _id } = req.session.user;
    console.log("hi amher",_id);
    const wishlist = await Wishlist.findOne({ _id }).populate("Product").exec();

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
    if (!req.session.user ) {
        return res.json({
          login: true,
          message: "Please login and continue shopping!",
        });
      }
     
    const { productId } = req.body;
    const userId = req.session.user._id;
    const existWishlist = await Wishlist.findOne({ userId });
    console.log(existWishlist);
    if (!existWishlist) {
          await new Wishlist({
          userId: userId,
          products: [productId],
        }).save();
        return res.status(200).json({ status: true });
      }
      const existProduct = existWishlist.products.find((product) => {
        return product.equals(productId);
      });
      if (existProduct) {
        return res.status(200).json({
          status: false,
        });
      }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "internal server error" });
  }
};

module.exports = {
  addToWishList,
  loadWishlistPage,
};
