const User = require("../models/userModel");
const Coupon = require("../models/couponnModel");
const userOtpVerification = require("../models/userOTPverification");
const Category = require("../models/categoriesModel");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const Product = require("../models/productSchema");
const Order = require("../models/orderSchema");
const Cart = require("../models/cartSchema");
const easyinvoice = require("easyinvoice");
const puppeteer = require("puppeteer");
const path = require("path");
const ejs = require("ejs");
const fs = require("fs");
const Razorpay = require("razorpay");
dotenv.config();

// ================================RAZORPAY INSTANCE========================================

var instance = new Razorpay({
  key_id: process.env.RazorId,
  key_secret: process.env.RazorKey,
});

// ===============================ORDER PLACING ================================//
const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const {
      selectedAddress,
      selectedShippingMethod,
      subTotalValue,
      couponCode,
    } = req.body;
    const cartData = await Cart.findOne({ userid: userId }).populate(
      "products.productId"
    );
    const cartProducts = cartData.products;

    const quantityLessProducts = [];
    cartProducts.forEach((pro) => {
      const productStock = pro.productId.stockQuantity; // Stock quantity of the product from the database
      const cartQuantity = pro.quantity; // Quantity of the product in the cart
      if (cartQuantity > productStock) {
        quantityLessProducts.push(pro.productId.name);
      }
    });

    if (quantityLessProducts.length > 0) {
      // Check if the array is not empty
      return res.json({ quantity: true });
    }

    const total = subTotalValue;
    const userData = await User.findOne({ _id: userId });
    const name = userData.name;

    const status = selectedShippingMethod === "COD" ? "placed" : "pending";
    const statusLevel = status === "placed" ? 1 : 0;
    const date = new Date();

    const delivery = new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000);
    const deliveryDate = delivery
      .toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })
      .replace(/\//g, "-");

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
      products: cartProducts,
      "couponApplied.discountAmount": cartData.couponApplied.discountAmount,
      "couponApplied.couponName": cartData.couponApplied.couponName,
    });

    let orderDetailsData = await newOrder.save();
    const orderId = orderDetailsData._id;

    if (orderDetailsData) {
      // cash on delivery

      if (orderDetailsData.status === "placed") {
        await Cart.deleteOne({ userid: userId });
        if (couponCode) {
          const appliedCoupon = await Coupon.findOne({
            couponCode: { $regex: new RegExp(couponCode, "i") },
          });
          appliedCoupon.usedUsers.push(userId);
          await appliedCoupon.save();
        }

        for (let i = 0; i < cartData.products.length; i++) {
          const productId = cartProducts[i].productId;
          const count = cartProducts[i].quantity;

          await Product.updateOne(
            {
              _id: productId,
            },
            {
              $inc: {
                stockQuantity: -count,
              },
            }
          );
        }
        res.json({ success: true, params: orderId });
      } else {
        // order not cod
        const orderId = orderDetailsData._id;
        const totalAmount = orderDetailsData.total_amount;

        if (orderDetailsData.payment == "onlinePayment") {
          var options = {
            amount: totalAmount * 100,
            currency: "INR",
            receipt: "" + orderId, // /we want here objectid t o strung
          };

          instance.orders.create(options, function (err, order) {
            res.json({ success: false, order });
          });
        } else if (orderDetailsData.payment == "wallet") {
          await Cart.deleteOne({ userid: userId });
          for (let i = 0; i < cartData.products.length; i++) {
            const productId = cartProducts[i].productId;
            const count = cartProducts[i].quantity;

            await Product.updateOne(
              {
                _id: productId,
              },
              {
                $inc: {
                  stockQuantity: -count,
                },
              }
            );
          }

          await Order.updateOne(
            {
              _id: orderId,
            },
            {
              $set: {
                status: "placed",
                statusLevel: 1,
              },
            }
          );
          // here i updateing the wallet balance
          await User.updateOne(
            {
              _id: userId,
            },
            {
              $inc: {
                wallet: -totalAmount,
              },
              $push: {
                walletHistory: {
                  date: new Date(),
                  amount: `-${totalAmount}`,
                  reason: "ordered with wallet",
                },
              },
            }
          );
          if (couponCode) {
            const appliedCoupon = await Coupon.findOne({
              couponCode: { $regex: new RegExp(couponCode, "i") },
            });
            appliedCoupon.usedUsers.push(userId);
            await appliedCoupon.save();
          }
          res.json({ success: true, params: orderId });
        }
      }
    }
  } catch (err) {
    console.log(err.message);
  }
};

const paymentVerfication = async (req, res) => {
  try {
    const cartData = await Cart.findOne({ userid: req.session.user._id });
    const products = cartData.products;
    const details = req.body;
    console.log("hey am here", details.order);
    const hmac = crypto.createHmac("sha256", process.env.RazorKey);
    hmac.update(
      details.payment.razorpay_order_id +
        "|" +
        details.payment.razorpay_payment_id
    );
    const hmacValue = hmac.digest("hex");
    if (
      hmacValue === details.payment.razorpay_signature ||
      details.razorpay_signature
    ) {
      await Cart.deleteOne({ userid: req.session.user._id });
      for (let i = 0; i < cartData.products.length; i++) {
        const productId = products[i].productId;
        const count = products[i].quantity;

        await Product.updateOne(
          {
            _id: productId,
          },
          {
            $inc: {
              stockQuantity: -count,
            },
          }
        );
      }
      console.log("how", details.order.receipt);
      await Order.findByIdAndUpdate(
        {
          _id: details.order.receipt,
        },
        {
          $set: {
            status: "placed",
            statusLevel: 1,
          },
        }
      );

      await Order.findByIdAndUpdate(
        {
          _id: details.order.receipt,
        },
        {
          $set: {
            paymentId: details.payment.razorpay_payment_id,
          },
        }
      );
      // await Cart.deleteOne({ userId: req.session.user._id });
      const orderid = details.order.receipt;
      const couponCode = details.couponCode; // Assuming details is defined and contains couponCode
      if (couponCode) {
        console.log("here wqeerewrwerewrwer", couponCode);
        const appliedCoupon = await Coupon.findOne({
          couponCode: { $regex: new RegExp(couponCode, "i") },
        });
        appliedCoupon.usedUsers.push(req.session.user._id);
        await appliedCoupon.save();
      }

      res.json({ codsuccess: true, orderid });
    } else {
      await Order.findByIdAndRemove({ _id: details.order.receipt });
      res.json({ success: false });
    }
  } catch (err) {
    console.log(err.message);
  }
};

// =============================== SUCCESS PAGE ================================//
const loadSuccess = async (req, res) => {
  try {
    res.render("successOrder");
  } catch (err) {
    console.log(err.message);
  }
};

// ===============================Order page loading for user side=================================//

const loadOrder = async (req, res) => {
  try {
    let page = 1;
    // if in query page we've to set
    if (req.query.page) {
      page = req.query.page;
    }
    let limit = 3;
    let previous = page > 1 ? page - 1 : 1;
    let next = page + 1;

    const sortOption = req.query.sortbyorder;
    console.log("hi ame", sortOption);
    const userId = req.session.user._id;
    console.log(userId, "its myyyy");
    // this is not thath url query
    let query = { userId: userId, status: "placed" };

    if (sortOption === "defaultbyplaced") {
      query.status = "placed";
    } else if (sortOption === "Shipped") {
      query.status = "shipped";
    } else if (sortOption === "Delivered") {
      query.status = "delivered";
    } else if (sortOption === "cancelled") {
      query.status = "cancelled";
    } else if (sortOption === "pending") {
      query.status = "pending";
    } else if (sortOption === "return") {
      query.status = { $in: ["Return Requested", "returned"] };
    }

    const orders = await Order.find(query)
      .populate("products.productId")
      .sort({ date: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    const count = await Order.countDocuments(query);

    const totalPages = Math.ceil(count / limit);

    if (next > totalPages) {
      next = totalPages;
    }

    console.log("here my all orders", orders);
    // Extract product details from orders
    const orderData = orders.map((order) => ({
      _id: order._id,
      user_name: order.user_name,
      date: new Date(order.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",

        hour12: true,
      }),
      total_amount: order.total_amount,
      payment: order.payment,
      status: order.status,
      statusLevel: order.statusLevel,
      expected_delivery: order.expected_delivery,
      products: order.products.map((product) => ({
        productId: product.productId,
        proquantity: product.quantity,
      })),
    }));

    res.render("ordersUserPage", {
      orderData,
      totalPages: totalPages,
      next: next,
      previous: previous,
      currentPage: page,
      sortOption: sortOption, //this foe i set pafination if paginartion press this should checl
    });
  } catch (err) {
    console.error(err.message);
    // Handle the error appropriately, for example, sending an error response.
  }
};

const userOderDetails = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const id = req.query.id;
    const orderedProduct = await Order.findOne({ _id: id }).populate(
      "products.productId"
    );

    // Extract the delivery address ObjectId
    const addressId = orderedProduct.delivery_address;
    const user = await User.findOne({ "addresses._id": addressId });
    const selectedAddress = user.addresses.find((address) =>
      address._id.equals(addressId)
    );

    // Define arrays for day and month names
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const monthsOfYear = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const currentDate = new Date();
    const day = daysOfWeek[currentDate.getDay()];
    const month = monthsOfYear[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    const formattedDate =
      day + ", " + month + " " + currentDate.getDate() + ", " + year;

    console.log(orderedProduct);
    res.render("orderFullDetails", {
      orders: orderedProduct,
      selectedAddress: selectedAddress,
      formattedDate: formattedDate,
    });
  } catch (err) {
    console.log(err.message);
  }
};

// =================================SHOW ORDERS LIST IN ADMIN SIDE==================================================//
const loadOrderlist = async (req, res) => {
  try {
    const ordersData = await Order.find()
      .populate("products.productId")
      .sort({ date: -1 });

    res.render("orderPage", { orders: ordersData });
  } catch (err) {
    console.log(err.message);
  }
};

const statusUpdate = async (req, res) => {
  try {
    const orderId = req.query.id;
    const orderData = await Order.findOne({ _id: orderId });
    const userId = orderData.userId;
    const statusLevel = req.query.status;
    const amount = orderData.total_amount;
    const products = orderData.products;

    if (statusLevel === "0") {
      await Order.updateOne(
        {
          _id: orderId,
        },
        {
          $set: {
            status: "cancelled",
            statusLevel: 0,
          },
        }
      );
      for (let i = 0; i < products.length; i++) {
        let pro = products[i].productId;
        let count = products[i].quantity;
        await Product.findOneAndUpdate(
          {
            _id: pro,
          },
          {
            $inc: {
              stockQuantity: count,
            },
          }
        );
      }
    } else if (statusLevel === "2") {
      await Order.updateOne(
        {
          _id: orderId,
        },
        {
          $set: {
            status: "shipped",
            statusLevel: 2,
            "products.$[].statusLevel": 2,
            "products.$[].status": "shipped",
          },
        }
      );
    } else if (statusLevel === "3") {
      await Order.updateOne(
        {
          _id: orderId,
        },
        {
          $set: {
            status: "delivered",
            deliveryDate: new Date(),
            statusLevel: 3,
            "products.$[].statusLevel": 3,
            "products.$[].status": "delivered",
          },
        }
      );
    }
    res.redirect("/admin/orders");
  } catch (err) {
    console.log(err.message);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const orderData = await Order.findOne({ _id: orderId });
    const products = orderData.products;
    const userId = req.session.user._id;
    // console.log("am hereee guys")
    await Order.updateOne(
      {
        _id: orderId,
      },
      {
        $set: {
          status: "cancelled",
          statusLevel: 0,
        },
      }
    );
    for (let i = 0; i < products.length; i++) {
      let pro = products[i].productId;
      let count = products[i].quantity;
      await Product.findOneAndUpdate(
        {
          _id: pro,
        },
        {
          $inc: {
            stockQuantity: count,
          },
        }
      );
    }
    if (orderData.payment !== `COD`) {
      await User.findOneAndUpdate(
        {
          _id: userId,
        },
        {
          $inc: {
            wallet: orderData.total_amount,
          },
          $push: {
            walletHistory: {
              date: new Date(),
              amount: orderData.total_amount,
              reason: "order cancellation",
            },
          },
        }
      );
    }

    res.json({ cancelled: true });
  } catch (err) {
    console.log(err.message);
  }
};

const returnReason = async (req, res) => {
  try {
    const { reason, productId, orderId } = req.body;

    const o = await Order.updateOne(
      { _id: orderId, "products.productId": productId },
      {
        $set: {
          "products.$.status": "Return Requested",
          "products.$.cancellationReason": reason,
          "products.$.statusLevel": 4,
        },
      }
    );
    console.log(o);

    res.json({ reason: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// return reason check rej and acc

const returnConf = async (req, res) => {
  try {
    console.log("I am here for confirmation");
    const { productId, btndata, orderId } = req.body;
    console.log(productId, orderId);
    const orderDet = await Order.findOne({
      _id: orderId,
      "products._id": productId,
    });
    const products = orderDet.products;
    const specificProduct = products.find(
      (product) => product._id.toString() === productId
    );
    const userId = orderDet.userId;
    const productIdOrginal = specificProduct.productId;

    let totalamountTowallet = specificProduct.totalPrice;

    if (btndata == "accept") {
      let productPrice = specificProduct.totalPrice;
      await Order.updateOne(
        {
          _id: orderId,
          "products._id": productId,
        },
        {
          $set: {
            "products.$.status": "returned",
            "products.$.statusLevel": 5,
          },
          $inc: {
            total_amount: -productPrice,
          },
        }
      );

      let count = specificProduct.quantity;
      console.log(count);

      const updated = await Product.updateOne(
        {
          _id: productIdOrginal,
        },
        {
          $inc: {
            stockQuantity: count,
          },
        }
      );
      await Product.find({
        _id: productIdOrginal,
      });

      await User.findOneAndUpdate(
        {
          _id: userId,
        },
        {
          $inc: {
            wallet: totalamountTowallet,
          },
          $push: {
            walletHistory: {
              date: new Date(),
              amount: totalamountTowallet,
              reason: "order return",
            },
          },
        }
      );
    } else if (btndata == "reject") {
      await Order.updateOne(
        {
          _id: orderId,
          "products._id": productId,
        },
        {
          $set: {
            "products.$.status": "delivered",
            "products.$.statusLevel": 3,
          },
        }
      );
    }

    res.json({ isOK: true });
  } catch (err) {
    console.log(err.message);
  }
};

const orderDetailedview = async (req, res) => {
  try {
    const orderId = req.query.id;

    const ordersData = await Order.findOne({ _id: orderId }).populate(
      "products.productId"
    );
    const userId = ordersData.userId;
    // Extract the delivery address ObjectId
    const addressId = ordersData.delivery_address;

    // here am doing get first documetn in array of address
    const userAddresses = await User.findOne(
      {
        addresses: {
          $exists: true,
          $ne: {},
        },
      },
      { addresses: 1 }
    );
    const userFirstadd = userAddresses.addresses[0];

    const userad = await User.findOne({ "addresses._id": addressId });

    const selectedAddress = userad.addresses.find((address) =>
      address._id.equals(addressId)
    );

    const userData = await User.findById(userId);

    res.render("orderDetail", {
      orders: ordersData,
      user: userData,
      selectedAddress: selectedAddress,
      userFirstadd: userFirstadd,
    });
  } catch (err) {
    console.log(err.message);
  }
};

const retryPayment = async (req, res) => {
  try {
    const { orderId, totalAmount } = req.body;
    console.log("both of two ", orderId, totalAmount);
    var options = {
      amount: totalAmount * 100,
      currency: "INR",
      receipt: "" + orderId, // /we want here objectid t o strung
    };
    console.log(options.amount);
    instance.orders.create(options, function (err, order) {
      console.log("here i syourt oerdaer", order);
      res.json({ payment: true, order });
    });
  } catch (err) {
    console.log(err);
    res.json(500).json({ message: "internal server error" });
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.session.user._id;
    const userDetails = await User.findById(userId);
    const orderDetails = await Order.findById(orderId).populate(
      "products.productId"
    );
    const date = new Date();

    data = {
      order: orderDetails,
      user: userDetails,
      date,
    };
    const filepathName = path.resolve(__dirname, "../views/users/invoice.ejs");

    const html = fs.readFileSync(filepathName).toString();
    const ejsData = ejs.render(html, data);

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(ejsData, { waitUntil: "networkidle0" });
    const pdfBytes = await page.pdf({ format: "letter" });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename= order invoice.pdf"
    );
    res.send(pdfBytes);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  placeOrder,
  paymentVerfication,
  loadSuccess,
  loadOrderlist,
  loadOrder,
  userOderDetails,
  statusUpdate,
  cancelOrder,
  returnReason,
  returnConf,
  orderDetailedview,
  retryPayment,
  downloadInvoice,
};
