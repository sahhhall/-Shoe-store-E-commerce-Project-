const mongoose = require('mongoose');


const couponSchema = mongoose.Schema({
    couponName: {
        type:String,
        required: true
    },
    couponCode: {
        type:String,
        required: true
    },
    discountAmount :{
        type: Number,
    },
    minAmount :{
        type: Number,
        required : true
    },
    // couponDescription :{
    //     type:String,
    //     required:true

    // }, 
     expiryDate: {
        type: Date,
        required: true,
      },
      usedUsers: [
        {
          type: mongoose.Types.ObjectId,
          ref: "User",
        },
      ],
      usersLimit: {
        type: Number,
        required: true,
      },
      status: {
        type: Boolean,
        default: true,
      }
})

module.exports = mongoose.model('coupon',couponSchema)