const Order = require("../models/orderSchema");
const Cart = require("../models/cartSchema");
const Coupon = require("../models/couponnModel");

const loadCouponPage = async (req, res) => {
  try {
    let page = 1;
    if (req.query.page) {
      page = +req.query.page;
    }
    const limit = 5;
    const coupons = await Coupon.find()
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Coupon.countDocuments();

    const totalPages = Math.ceil(count / limit);
    let previous = page > 1 ? page - 1 : 1;
    let next = page + 1;
    if (next > totalPages) {
      next = totalPages;
    }
    res.render("couponsPage", {
      coupons: coupons,
      totalPages: totalPages,
      currentPage: page,
      previous: previous,
      next: next,
    });
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
    const existingName = await Coupon.findOne({
      couponName: req.body.couponName,
    });
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
    const couponData = await Coupon.findById(couponId);
    await Coupon.findByIdAndUpdate(couponId, {
      $set: {
        status: !couponData.status,
      },
    });
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
    const sameCoupon = existingName._id.toString() === id;
    if (existingName && sameCoupon === false) {
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

const reomoveCoupon = async (req, res) => {
  try {
    const { couponName } = req.body;
    const userId = req.session.user._id;
    await Cart.updateOne({ userid: userId }, { $unset: { couponApplied: "" } });

    await Coupon.updateOne(
      { couponName: couponName },
      {
        $pop: {
          usedUsers: 1,
        },
      }
    );

    const subTotal = await Order.find();
    return res.json({ reomoved: true });
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
  reomoveCoupon,
};
