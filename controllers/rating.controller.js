const Product = require("../models/productSchema");
const Rating = require("../models/rating.schema.js");
const User = require("../models/userModel");
const Order = require("../models/orderSchema");
const addRating = async (req, res) => {
  try {
    const { stars, comment, productID, orderId } = req.body;
    const currentDate = new Date();
    const user = req.session.user._id;
    if (!user) {
      // for redirect to sign in page
    }
    // const existingReview = await Rating.findOne({
    //   productId: productID,
    //   "review.userId": user,
    // });
    // if (existingReview) {
    //   return res
    //     .status(200)
    //     .json({ message: "you already reviewd this product" });
    // }
    const existProduct = await Rating.findOne({ productId: productID });
    if (existProduct) {
      await Rating.findOneAndUpdate(
        { productId: productID },
        {
          $push: {
            review: {
              userId: user,
              comment: comment,
              rating: stars,
              created: currentDate,
            },
          },
        },
        { upsert: true, new: true }
      );
    } else {
      const newRating = new Rating({
        productId: productID.toString(),
        review: [
          {
            userId: user,
            comment: comment,
            rating: stars,
            created: currentDate,
          },
        ],
      });

      await newRating.save();
    }
    await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          "products.$[elem].isRated": true,
        },
      },
      {
        arrayFilters: [{ "elem.productId": productID }],
      }
    );
    // const averageRating = await Rating.aggregate([
    //     { $match: { productId: productID } },
    //     { $unwind: "$review" },
    //     { $group: {
    //       _id: "$productID",
    //       averageRating: { $avg: "$review.rating" }
    //     } },
    //     { $project: {
    //       _id: 0,
    //       averageRating: 1
    //     } }
    //   ]);
    const averageRating = await Rating.aggregate([
      // Aggregation pipeline
      { $unwind: "$review" },
      {
        $group: {
          _id: "$productId",
          avgRating: { $avg: "$review.rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);
    const roundedAverageRating = Math.round(averageRating[0].avgRating);

    await Product.findByIdAndUpdate(productID, {
      $set: {
        totalRatings: averageRating[0].totalReviews,
        averageRating: roundedAverageRating,
      },
    });
    console.log(averageRating[0].avgRating, "averageRating");
    return res.status(200).json({ message: "Rating added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong " });
  }
};

module.exports = {
  addRating,
};
