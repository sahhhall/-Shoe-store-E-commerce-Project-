const Cart = require('../models/cartSchema');

const loadCartMiddleware = async (req, res, next) => {
    try {
      if (req.session.user && req.session.user._id) {
        const userId = req.session.user._id;
        const cartDetails = await Cart.findOne({ userid: userId }).populate({ path: 'products.productId' });
        let initialAmount = 0;
        if (cartDetails) {
          cartDetails.products.forEach((item) => {
            let itemPrice = item.productPrice;
            initialAmount += itemPrice * item.quantity;
          });
        }
        res.locals.cartDetails = cartDetails;
        res.locals.subTotal = initialAmount;
      }
      next();
    } catch (err) {
      console.log(err.message);
      next(err);
    }
  };

  module.exports={
    loadCartMiddleware
  }