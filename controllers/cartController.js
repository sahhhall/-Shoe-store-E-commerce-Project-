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
      const { productId, size } = req.body;
      console.log("size is", size);
      const productData = await Product.findOne({ _id: productId });
      const cart = await Cart.findOne({ userid: userId });
      let existingInCart = false;
      let stockQuantityFalse = false;
      if (cart) {
        // we need to check the product exist or not because if exist we need onlu updation
        const sameproductCountinCart = cart.products.reduce((acc, product) => {
          if (product.productId.toString() == productId) {
            acc++;
          }
          return acc;
        }, 0);
        const existProduct = cart.products.find(
          (pro) => pro.productId.toString() == productId
        );
        let sizeExist = cart.products.some((product) => {
          return (
            product.productId.toString() === productId &&
            product.sizes.includes(size)
          );
        });

        if (existProduct && sizeExist) {
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
          console.log(
            "Product with same ID and size already exists in the cart"
          );
          existingInCart = true;
        } else if (sameproductCountinCart >= productData.stockQuantity) {
          stockQuantityFalse = true;
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
                  sizes: size,
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
              sizes: size,
            },
          ],
        });
        await newCart.save();
      }
      res.json({ success: true, existingInCart, stockQuantityFalse });
    }
  } catch (err) {
    console.log(err.message);
  }
};

const removeCartItem = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const proId = req.body.product;
    const { size } = req.body;

    const cartData = await Cart.findOne({ userid: userId });

    console.log("am here");

    if (cartData) {
      await Cart.findOneAndUpdate(
        { userid: userId },
        {
          $pull: {
            products: {
              $and: [{ productId: proId }, { sizes: size }],
            },
          },
        }
      );
      console.log(cartData.products.length, "cartData.products.length");
      if (cartData.products.length <= 1) {
        await Cart.findOneAndUpdate(
          { userid: userId },
          {
            $unset: { couponApplied: "" },
          }
        );
      }

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
    let { product, count, size } = req.body;
    const userId = req.session.user._id;
    count = parseInt(count);
    const productDetails = await Product.findById(product);

    const cartDetails = await Cart.findOne({ userid: userId });

    const previousProduct = cartDetails.products.find(
      (productt) => productt.productId.toString() === product.toString()
    );

    const sameproductCountinCart = cartDetails.products.reduce(
      (acc, productt) => {
        if (productt.productId.toString() == product.toString()) {
          acc = acc + productt.quantity;
        }
        return acc;
      },
      0
    );
    console.log(sameproductCountinCart, productDetails.stockQuantity);
    if (
      previousProduct.quantity + count > 5 ||
      productDetails.stockQuantity < previousProduct.quantity + count ||
      (sameproductCountinCart >= productDetails.stockQuantity && count != -1)
    ) {
      res.json({ success: false, message: "Product Quantity  limit reached!" });
    } else {
      const productTotal =
        previousProduct.productPrice * (previousProduct.quantity + count);
      console.log(productTotal);
      await Cart.updateOne(
        {
          userid: userId,
          "products.productId": product,
          "products.sizes": size,
        },
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
    var couponCode;
    var discountAmount;
    var couponName;
    if (cartDetails.couponApplied) {
      couponCode = cartDetails.couponApplied.couponCode;
      discountAmount = cartDetails.couponApplied.discountAmount;
      couponName = cartDetails.couponApplied.couponName;
    }
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
          if (discountAmount) {
            initialAmount -= discountAmount;
          }
        });
      }
      res.render("checkOutshipping", {
        cartDetails,
        subTotal: initialAmount,
        addresses: addresses,
        walletAmount: walletAmount,
        couponView: coupons,
        couponCode,
        discountAmount,
        couponName,
      });
    }
    // const products = cartDetails.products;
  } catch (err) {
    console.log(err.message);
  }
};
const applyCoupon = async (req, res) => {
  try {
    const { couponCode, total, cartId } = req.body;
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
    // appliedCoupon.usedUsers.push(currUserId);
    await Cart.updateOne(
      { _id: cartId },
      {
        $set: {
          "couponApplied.couponCode": couponCode,
          "couponApplied.discountAmount": discountValue,
          "couponApplied.couponName": appliedCoupon.couponName,
        },
      }
    );
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
