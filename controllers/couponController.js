const Order = require("../models/orderSchema");
const Cart = require("../models/cartSchema");
const Coupon = require("../models/couponnModel");

const loadCouponPage = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.render("couponsPage", { coupons: coupons });
  } catch (err) {
    console.log(err.message);
  }
};

const loadAddCoupon = async (req, res) => {
  try {
    res.render("addCoupon");
  } catch (err) {
    console.log(err.messgae);
  }
};

const addCoupon = async (req, res) => {
  try {
    const existingName = await Coupon.findOne({ couponName: req.body.couponName });
    if (existingName) {
      req.flash("conflicts", "Coupon name already exists");
      return res.redirect(`/admin/addCoupon`);
    }
    const firstName = req.body.couponName.split("").splice(0, 1).join("");
    const randomString = Math.random().toString(36).substring(2, 7);
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const generatedCode = `${firstName}${randomString}${randomNumber}`;
    console.log(generatedCode);
    const coupon = new Coupon({
      couponName: req.body.couponName,
      couponCode: generatedCode,
      discountAmount: req.body.discount,
      minAmount: req.body.criteriaAmount,
      expiryDate: req.body.expiryDate,
      usersLimit: req.body.usersLimit,
    });

    await coupon.save();
    res.redirect("/admin/coupons");
  } catch (err) {
    console.log(err.messgae);
  }
};
const deactivateCoupon = async (req, res) => {
  try {
    const { couponId } = req.body;
    console.log("am herererere");

    const couponData = await Coupon.findById(couponId);
    await Coupon.findByIdAndUpdate(couponId, {
      $set: {
        status: !couponData.status,
      },
    });
    console.log(couponData);
    res.json({ block: true, status: couponData.status });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const editCouponPageLoad = async (req, res) => {
  try {
    const couponID = req.query.id;
    const couponDetails = await Coupon.findById(couponID);
    res.render("editCoupon", {
      coupon: couponDetails,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "internal server error" });
  }
};

const editCoupon = async (req, res) => {
  try {
    const { id, couponName, discount, criteriaAmount, expiryDate, usersLimit } =
      req.body;
    const existingName = await Coupon.findOne({ couponName: couponName });
    console.log("here", existingName);
    console.log("hi am from server");
    if (existingName) {
      console.log("hii");
      req.flash("conflicts", "Coupon name already exists");
      return res.redirect(`/admin/edit-coupon?id=${id}`);
    } else {
      await Coupon.updateOne(
        { _id: id },
        {
          $set: {
            couponName: couponName,
            discountAmount: discount,
            minAmount: criteriaAmount,
            expiryDate: expiryDate,
            usersLimit: usersLimit,
          },
        }
      );

      return res.redirect("/admin/coupons");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "internal server error" });
  }
};

module.exports = {
  loadCouponPage,
  loadAddCoupon,
  addCoupon,
  deactivateCoupon,
  editCouponPageLoad,
  editCoupon,
};
