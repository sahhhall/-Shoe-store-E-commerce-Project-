const Order = require("../models/orderSchema");
const User = require("../models/userModel");
const Category = require("../models/categoriesModel");
const Product = require("../models/productSchema");
const puppeteer = require("puppeteer");
const path = require("path");
const ejs = require("ejs");
const fs = require("fs");
const { setMaxListeners } = require("stream");
const loadDashboard = async (req, res) => {
  try {
    let totalRevenue;
    let totalOrders;
    let totalProduct;
    let totalCategories;
    let totalUsers;

    const thisYear = new Date().getFullYear();

    // Construct a valid date object for the start of the current year (January 1st)
    // here i started year 2024 in thisyear and 0 as month which monthi should start we have to
    //mention that here months are zero-indexed so i want januvary so second construcotor param as 0
    // last one is  the day parameter
    const startOfThisYear = new Date(thisYear, 0, 1);
    let monthBaseRevenue = new Array(12).fill(0);
    const monthBaseRev = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          createdAt: { $gte: startOfThisYear },
        },
      },
      {
        $group: {
          // i want group diff documnets uwith month
          // its id month number
          _id: { $month: "$createdAt" },
          totalRevenue: { $sum: "$total_amount" },
        },
      },
    ]);


    let monthBaseUser = new Array(12).fill(0);
    const user = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfThisYear },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalUsers: { $sum: 1 },
        },
      },
    ]);

    const productSorted = await Order.aggregate([
      {
        $unwind: "$products",
      },
      {
        $match: {
          $or: [
            { "products.status": "delivered" },
            { "products.status": "placed" },
            { "products.status": "shipping" },
          ],
        },
      },
      {
        $group: {
          _id: "$products.productId",
          productOrders: {
            $sum: "$products.quantity",
          },
          totalRevenue: {
            $sum: {
              $multiply: ["$products.quantity", "$products.productPrice"],
            },
          },
        },
      },
      {
        $sort: {
          productOrders: -1, // Sort in descending order of product orders count
        },
      },
      {
        $limit: 5, //  top 5 products
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
    ]);

    // revenue
    const revenue = await Order.aggregate([
      {
        $match: {
          status: "delivered",
        },
      },
      {
        $group: {
          _id: "$status",
          total_revenue: { $sum: "$total_amount" },
        },
      },
    ]);

    const ordersCount = await Order.countDocuments();
    const productsCount = await Product.countDocuments();
    const categoryCount = await Category.countDocuments();
    const userCount = await User.countDocuments();
    totalUsers = userCount;
    totalOrders = ordersCount;
    totalProduct = productsCount;
    totalCategories = categoryCount;
    totalRevenue = revenue[0]?.total_revenue || 0;

    monthBaseRev.forEach((item) => {
      monthBaseRevenue[item._id - 1] = item.totalRevenue;
    });
    user.forEach((item) => {
      monthBaseUser[item._id - 1] = item.totalUsers;
    });

    res.render("adminDashboard", {
      monthBaseRevenue,
      monthBaseUser,
      totalRevenue,
      totalOrders,
      totalProduct,
      totalCategories,
      totalUsers,
      productSorted,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const fetchTopSelledCateogry = async (req, res) => {
  try {
    const { selection } = req.body;
    let pipeline;
    if (selection === "category") {
      pipeline = [
        {
          $unwind: "$products",
        },
        {
          $match: {
            "products.status": { $in: ["delivered", "placed", "shipping"] },
          },
        },
        {
          $group: {
            _id: "$products.productId",
            productOrders: {
              $sum: "$products.quantity",
            },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        {
          $unwind: "$productDetails",
        },
        {
          $lookup: {
            from: "categories",
            localField: "productDetails.categorys",
            foreignField: "_id",
            as: "categoryDetails",
          },
        },
        {
          $unwind: "$categoryDetails",
        },
        {
          $group: {
            _id: "$categoryDetails.name",
            totalOrders: { $sum: "$productOrders" },
            active: { $first: "$categoryDetails.is_listed" },
          },
        },
        {
          $sort: {
            totalOrders: -1,
          },
        },
        {
          $limit: 5, // Limit to the top
        },
      ];
    } else {
      pipeline = [
        {
          $unwind: "$products",
        },
        {
          $match: {
            $or: [
              { "products.status": "delivered" },
              { "products.status": "placed" },
              { "products.status": "shipping" },
            ],
          },
        },
        {
          $group: {
            _id: "$products.productId",
            productOrders: {
              $sum: "$products.quantity",
            },
            totalRevenue: {
              $sum: {
                $multiply: ["$products.quantity", "$products.productPrice"],
              },
            },
          },
        },
        {
          $sort: {
            productOrders: -1, // Sort in descending order of product orders count
          },
        },
        {
          $limit: 5,
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productDetails",
          },
        },
      ];
    }
    const top5 = await Order.aggregate(pipeline);
    res.status(200).json({ filtered: top5 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "internla server eror" });
  }
};

const filterYearlyMonthly = async (req, res) => {
  try {
    const { monthYear } = req.body;
    const [year, month] = monthYear.split("-");
    const startOfFilter = new Date(year, month - 1, 1);
    const endOfFilter = new Date(year, month, 0);
    const daysInMonth = endOfFilter.getDate();
    let daysArr = [];
    for (let i = 0; i < daysInMonth; i++) {
      daysArr.push(i + 1);
    }

    let dayBaseRevenue = new Array(daysInMonth).fill(0);
    let dayBaseUser = new Array(daysInMonth).fill(0);

    const dayBaseRev = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          createdAt: { $gte: startOfFilter, $lte: endOfFilter },
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          totalRevenue: { $sum: "$total_amount" },
        },
      },
    ]);

    const user = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfFilter, $lte: endOfFilter },
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          totalUsers: { $sum: 1 },
        },
      },
    ]);

    dayBaseRev.forEach((item) => {
      dayBaseRevenue[item._id - 1] = item.totalRevenue;
    });

    user.forEach((item) => {
      dayBaseUser[item._id - 1] = item.totalUsers;
    });

    res.status(200).json({
      dayBaseRevenue,
      dayBaseUser,
      daysArr,
    });
  } catch (error) {
    console.log(error);
  }
};

const salesReport = async (req, res) => {
  try {
    const { startingDate, endDate } = req.body;
    const startDate = new Date(startingDate);
    const toDate = new Date(endDate);

    const pipeline = [
      {
        $match: {
          $and: [
            { createdAt: { $gte: startDate } },
            { createdAt: { $lte: toDate } },
          ],
        },
      },
      {
        $unwind: "$products",
      },
      {
        $match: {
          "products.status": { $in: ["delivered", "placed", "shipping"] },
        },
      },
      {
        $group: {
          _id: "$products.productId",
          QuantitySold: { $sum: "$products.quantity" },
          totalRevenue: {
            $sum: {
              $multiply: ["$products.quantity", "$products.productPrice"],
            },
          },
          unitPrice: { $first: "$products.productPrice" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $addFields: {
          productName: { $arrayElemAt: ["$productInfo.name", 0] },
        },
      },
      {
        $project: {
          _id: 0,
          productName: 1,
          QuantitySold: 1,
          totalRevenue: 1,
          unitPrice: 1,
        },
      },
    ];

    const orderCount = await Order.countDocuments({
      createdAt: { $gte: startDate, $lte: toDate },
    });

    const salesReportData = await Order.aggregate(pipeline);
    const revenueAllOverProduct = salesReportData.reduce((acc, pro) => {
      acc = acc + pro.totalRevenue;
      return acc;
    }, 0);

    data = {
      salesDetails: salesReportData,
      orderCount,
      revenueAllOverProduct,
      startDate,
      toDate,
    };
    const filepathName = path.resolve(
      __dirname,
      "../views/users/salesReport.ejs"
    );
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
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  loadDashboard,
  fetchTopSelledCateogry,
  filterYearlyMonthly,
  salesReport,
};
