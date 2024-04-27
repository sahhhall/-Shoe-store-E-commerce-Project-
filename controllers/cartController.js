const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const Category = require("../models/categoriesModel");
const Product = require("../models/productSchema");
const Cart = require("../models/cartSchema");
const Coupon = require("../models/couponnModel");

// =============================================LOAD CART PAGE=========================================================//
const loadCart = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user._id) {
      req.flash("success", "pleasee login to get our sevice");
      res.redirect("/signin");
    } else {
      const userId = req.session.user._id;

      const cartDetails = await Cart.findOne({ userid: userId }).populate({
        path: "products.productId",
      });
      let initialAmount = 0;
      if (cartDetails) {
        cartDetails.products.forEach((item) => {
          let itemPrice = item.productPrice;
          initialAmount += itemPrice * item.quantity;
        });
      }
      // const products = cartDetails.products;

      res.render("cartPage", { cartDetails, subTotal: initialAmount });
    }
  } catch (err) {
    console.log(err.message);
  }
};

// =============================================PRODUCT ADDING TO CART==================================================//
const addtoCart = async (req, res) => {
  try {
    // console.log(productData+"quantuty is"+productquantity);
    if (!req.session.user || !req.session.user._id) {
      return res.json({
        login: true,
        message: "Please login and continue shopping!",
      });
    } else {
      const userId = req.session.user._id;
      // const userData = await User.findOne({_id: userId});
      const { productId } = req.body;
      const productData = await Product.findOne({ _id: productId });
      const cart = await Cart.findOne({ userid: userId });
      let existingInCart = false;
      if (cart) {
        // we need to check the product exist or not because if exist we need onlu updation

        const existProduct = cart.products.find(
          (pro) => pro.productId.toString() == productId
        );
        if (existProduct) {
          // await Cart.findOneAndUpdate(
          //   {
          //     userid: userId,
          //     "products.productId": productId,
          //   },
          //   {
          //     $inc: {
          //       "products.$.quantity": productquantity,
          //       "products.$.totalPrice":
          //         productquantity * existProduct.productPrice,
          //     },
          //   }
          // );
          existingInCart = true;
        } else {
          //    add new product to cart
          await Cart.findOneAndUpdate(
            {
              userid: userId,
            },
            {
              $push: {
                products: {
                  productId: productId,
                  quantity: 1,
                  productPrice: productData.price,
                  totalPrice: 1 * productData.price,
                },
              },
            }
          );
        }
      } else {
        // create bew cart  here am adding new product to cart
        const newCart = new Cart({
          userid: userId,
          products: [
            {
              productId: productId,
              quantity: 1,
              productPrice: productData.price,
              totalPrice: 1 * productData.price,
            },
          ],
        });
        await newCart.save();
      }
      res.json({ success: true, existingInCart });
    }
  } catch (err) {
    console.log(err.message);
  }
};

const removeCartItem = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const proId = req.body.product;
    console.log(userId);

    const cartData = await Cart.findOne({ userid: userId });

    console.log("am here");

    if (cartData) {
      await Cart.findOneAndUpdate(
        { userid: userId },
        {
          $pull: { products: { productId: proId } },
        }
      );

      console.log("am here too");
      res.json({ success: true });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const quantityUpdationCart = async (req, res) => {
  try {
    let { product, count } = req.body;
    const userId = req.session.user._id;
    count = parseInt(count);
    console.log(userId);
    const productDetails = await Product.findById(product);

    const cartDetails = await Cart.findOne({ userid: userId });

    const previousProduct = cartDetails.products.find(
      (productt) => productt.productId.toString() === product.toString()
    );
    console.log("this", previousProduct);

    if (previousProduct.quantity + count > 5 || productDetails.stockQuantity < count ) {
      res.json({ success: false, message: "Product Quantity  limit reached!" });
    } else {
      const productTotal =
        previousProduct.productPrice * (previousProduct.quantity + count);
      console.log(productTotal);
      await Cart.updateOne(
        { userid: userId, "products.productId": product },
        { $inc: { "products.$.quantity": count } }
      );
      await Cart.updateOne(
        { userid: userId, "products.productId": product },
        { $set: { "products.$.totalPrice": productTotal } }
      );

      res.json({ success: true });
    }
  } catch (err) {
    console.log(err.message);
  }
};

const loadCheckOut = async (req, res) => {
  try {
    const coupons = await Coupon.find({ status: true });
    console.log("here all coupons", coupons);
    const userId = req.session.user._id;
    const user = await User.findById(userId);
    const addresses = user.addresses;
    const cartDetails = await Cart.findOne({ userid: userId }).populate({
      path: "products.productId",
    });
    if (cartDetails.products.length <= 0) {
      console.log("ddddd");
      res.redirect("/cart");
    } else {
      const walletAmount = user.wallet;

      let initialAmount = 0;
      if (cartDetails) {
        cartDetails.products.forEach((item) => {
          let itemPrice = item.productPrice;
          initialAmount += itemPrice * item.quantity;
        });
      }
      res.render("checkOutshipping", {
        cartDetails,
        subTotal: initialAmount,
        addresses: addresses,
        walletAmount: walletAmount,
        couponView: coupons,
      });
    }
    // const products = cartDetails.products;
  } catch (err) {
    console.log(err.message);
  }
};
const applyCoupon = async (req, res) => {
  try {
    const { couponCode, total } = req.body;
    console.log("hioiii", couponCode);
    const appliedCoupon = await Coupon.findOne({
      couponCode: { $regex: new RegExp(couponCode, "i") },
    });

    console.log(appliedCoupon);
    if (!appliedCoupon) {
      console.log("Coupon not found");
      return res.json({ no: true });
    }

    const { discountAmount, minAmount, expiryDate, usedUsers } = appliedCoupon;
    const currUserId = req.session.user._id;

    if (minAmount >= total) {
      return res.json({ minAmount: true, requiredAmount: minAmount });
    }

    if (usedUsers.includes(currUserId)) {
      return res.json({ usedAlready: true });
    }

    const isCouponExpired = expiryDate && expiryDate < new Date();

    if (isCouponExpired) {
      return res.json({ time: true });
    }

    // Apply the coupon
    // Add the user to the usedUsers array
    const discountValue = Math.floor((discountAmount / 100) * total);
    const totalUpdated = total - discountValue;
    console.log(discountValue, "discounttttttttttttt");
    appliedCoupon.usedUsers.push(currUserId);
    await appliedCoupon.save();

    return res.json({
      list: true,
      discountAmount: discountValue,
      totalUpdated: totalUpdated,
      couponName: appliedCoupon.couponName,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  loadCart,
  addtoCart,
  loadCheckOut,
  removeCartItem,
  quantityUpdationCart,
  applyCoupon,
};
