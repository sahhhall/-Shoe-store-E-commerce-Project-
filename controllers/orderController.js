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

// ===============================ORDER PLACING ================================//
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
        const statusLevel = status === "placed" ? 1 : 0;
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
            total_amount: subTotalValue,
            date: date,
            status: status,
            statusLevel: statusLevel,
            expected_delivery: deliveryDate,
            payment: selectedShippingMethod,
            products: cartProducts
        });


        let orderDetailsData = await newOrder.save();
        const orderId = orderDetailsData._id;
        await Cart.deleteOne({userid: userId});
        for (let i = 0; i < cartData.products.length; i++) {
            const productId = cartProducts[i].productId;
            const count = cartProducts[i].quantity;

            await Product.updateOne({
                _id: productId
            }, {
                $inc: {
                    stockQuantity: - count
                }
            });
        }
        res.json({success: true, params: orderId});

    } catch (err) {

        console.log(err.message)
    }
}
// =============================== SUCCESS PAGE ================================//
const loadSuccess = async (req, res) => {
    try {
        res.render('successOrder');
    } catch (err) {
        console.log(err.message)
    }
}


// ===============================Order page loading for user side=================================//

const loadOrder = async (req, res) => {
    try {


        const userId = req.session.user._id;

        const orders = await Order.find({userId}).populate('products.productId').sort({date: -1});

        // Extract product details from orders
        const orderData = orders.map(order => ({
            _id: order._id,
            user_name: order.user_name,
            date: new Date(order.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',

                hour12: true
            }),
            total_amount: order.total_amount,
            payment: order.payment,
            status: order.status,
            statusLevel: order.statusLevel,
            expected_delivery: order.expected_delivery,
            products: order.products.map(product => ({productId: product.productId, proquantity: product.quantity}))
        }));

        res.render('ordersUserPage', {orderData});

    } catch (err) {
        console.error(err.message);
        // Handle the error appropriately, for example, sending an error response.

    }
};

const userOderDetails = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const id = req.query.id;
        const orderedProduct = await Order.findOne({_id: id}).populate("products.productId");


        // Extract the delivery address ObjectId
        const addressId = orderedProduct.delivery_address;
        const user = await User.findOne({"addresses._id": addressId});
        const selectedAddress = user.addresses.find(address => address._id.equals(addressId));
    


        // Define arrays for day and month names
        const daysOfWeek = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday'
        ];
        const monthsOfYear = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December'
        ];
        const currentDate = new Date();
        const day = daysOfWeek[currentDate.getDay()];
        const month = monthsOfYear[currentDate.getMonth()];
        const year = currentDate.getFullYear();
        const formattedDate = day + ', ' + month + ' ' + currentDate.getDate() + ', ' + year;

        console.log(orderedProduct);
        res.render("orderFullDetails", {
            orders: orderedProduct,
            selectedAddress: selectedAddress,
            formattedDate: formattedDate
        });
    } catch (err) {
        console.log(err.message);
    }
};


// =================================SHOW ORDERS LIST IN ADMIN SIDE==================================================//
const loadOrderlist = async (req, res) => {
    try {
        const ordersData = await Order.find().populate("products.productId").sort({date: -1});
       
        res.render('orderPage', {orders: ordersData})
    } catch (err) {
        console.log(err.message)
    }
}

const statusUpdate = async (req, res) => {
    try {
        const orderId = req.query.id;
        const orderData = await Order.findOne({_id: orderId});
        const userId = orderData.userId
        const statusLevel = req.query.status;
        const amount = orderData.total_amount;
        const products = orderData.products;

        if (statusLevel === '0') {
            await Order.updateOne({
                _id: orderId
            }, {
                $set: {
                    status: "cancelled",
                    statusLevel: 0
                }
            });
            for (let i = 0; i < products.length; i++) {
                let pro = products[i].productId;
                let count = products[i].count;
                await Product.findOneAndUpdate({
                    _id: pro
                }, {
                    $inc: {
                        quantity: count
                    }
                });
            }
        } else if (statusLevel === '2') {
            await Order.updateOne({
                _id: orderId
            }, {
                $set: {
                    status: "shipped",
                    statusLevel: 2
                }
            })
        } else if (statusLevel === '3') {
            await Order.updateOne({
                _id: orderId
            }, {
                $set: {
                    status: "delivered",
                    deliveryDate: new Date(),
                    statusLevel: 3
                }
            });
        }
        res.redirect("/admin/orders");
    } catch (err) {
        console.log(err.message)
    }
}


const cancelOrder = async(req,res)=>{
  try{
    const {orderId} =req.body;
    const orderData = await Order.findOne({_id: orderId});
    const products = orderData.products;

    // console.log("am hereee guys")
            await Order.updateOne({
              _id: orderId
          }, {
              $set: {
                  status: "cancelled",
                  statusLevel: 0
              }
          });
          for (let i = 0; i < products.length; i++) {
              let pro = products[i].productId;
              let count = products[i].count;
              await Product.findOneAndUpdate({
                  _id: pro
              }, {
                  $inc: {
                      quantity: count
                  }
              });
          }
          res.json({cancelled:true});
  }catch(err){
    console.log(err.message)
  }
}


const returnReason = async(req,res)=>{
    try {
            const { reason,
                orderid} = req.body;
                await Order.findByIdAndUpdate(
                    { _id: orderid },
                    {
                        $set: {
                            cancellationReason: returnReason,
                            status: "Returned",
                            statusLevel: 0
                        }
                    }
                );
                res.json({reason: true});
    }catch(err){
        console.log(err)
    }
}

module.exports = {
    placeOrder,
    loadSuccess,
    loadOrderlist,
    loadOrder,
    userOderDetails,
    statusUpdate,
    cancelOrder,
    returnReason
}
