const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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


module.exports = mongoose.model('Cart',cartSchema);