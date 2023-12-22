const mongoose=require('mongoose')
const Schema = mongoose.Schema;



const orderSchema=new Schema({
    userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
    delivery_address:{
        type:String,
        required:true
    },
    user_name:{
        type:String,
        required:true
    },
    total_amount:{
        type:Number,
        required:true
    },
    date:{
        type:String,
        required:true
    },
    expected_delivery:{
        type:String,
        required:true

    },
    status: {
        type: String,
      },
      statusLevel: {
        type: Number,
        default: 0
      },
    payment:{
        type:String,
        required:true
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true

            },
            quantity: {
                type: Number,
                default: 1
            },
            productPrice: {
                type: Number,
                required: true
            },
            totalPrice: {
                type: Number,
                default: 0
            },
            status: {
                type: String,
                default: "placed"
            },
            cancellationReason: {
                type: String,
                default: "none"
            }

        },
    ]


})

module.exports=mongoose.model('Order',orderSchema)