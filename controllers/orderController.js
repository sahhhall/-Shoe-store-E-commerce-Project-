const User = require('../models/userModel');
const userOtpVerification = require('../models/userOTPverification')
const Category = require('../models/categoriesModel')
const Token = require('../models/tokenModel');
const crypto = require("crypto");
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const Product = require('../models/productSchema');
const Order = require('../models/orderSchema');
const Cart = require('../models/cartSchema')
dotenv.config();


const placeOrder = async (req, res) => {

    try {

        const userId = req.session.user._id;
        const {selectedAddress, selectedShippingMethod, subTotalValue} = req.body;
        const cartData = await Cart.findOne({userid: userId});
        const cartProducts = cartData.products;
        console.log(cartProducts);
        const total = subTotalValue;
        const userData = await User.findOne({_id: userId});
        const name = userData.name;
        console.log(name, selectedShippingMethod);
        const status = selectedShippingMethod === "COD" ? "placed" : "pending";

        const date = new Date();

        const delivery = new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000);
        const deliveryDate = delivery.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        }).replace(/\//g, '-');
        
      const newOrder = new Order({
        userId: userId,
        delivery_address: selectedAddress,
        user_name: name,
        total_amount:subTotalValue,
        date: date,
        status:status,
        expected_delivery: deliveryDate,
        payment: selectedShippingMethod,
        products: cartProducts,
      });


      let orderDetailsData =  await newOrder.save();
      const orderId =  orderDetailsData._id;
      await Cart.deleteOne({ userid:userId });
      for (let i = 0; i < cartData.products.length; i++) {
        const productId = cartProducts[i].productId;
        const count = cartProducts[i].quantity;

        await Product.updateOne(
          { _id: productId },
          { $inc: { stockQuantity: -count } }
        );
      }
      res.json({ success: true, params: orderId });

    } catch (err) {

        console.log(err.message)
    }
}

const loadSuccess = async(req,res)=>{
    try{
        res.render('successOrder');
    }catch(err){
        console.log(err.message)
    }
}

module.exports = {
    placeOrder,
    loadSuccess
}
