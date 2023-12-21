const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const Category = require('../models/categoriesModel');
const Product = require('../models/productSchema')
const Cart = require('../models/cartSchema')


//=============================================LOAD CART PAGE=========================================================//
const loadCart = async (req, res) => {
    try {
        res.render('cartPage');
    } catch (err) {
        console.log(err.message);
    }
}

//=============================================PRODUCT ADDING TO CART==================================================//
const addtoCart = async (req, res) => {
    try { // console.log(productData+"quantuty is"+productquantity);
        if (!req.session.user || !req.session.user._id) {
            return res.json({login: true, message: "Please login and continue shopping!"});
        } else {
            const userId = req.session.user._id;
            const userData = await User.findOne({_id: userId});
            const {productId, productquantity} = req.body;
            const productData = await Product.findOne({_id: productId});
            const cart = await Cart.findOne({userid: userId});
            const productprice = productData.price;
            // console.log(productprice)
            if (cart) {
                    // we need to check the product exist or not because if exist we need onlu updation 

                const existProduct = cart.products.find((pro) => pro.productId.toString() == productId);
                if (existProduct) {
                    await Cart.findOneAndUpdate({
                        userid: userId,
                        "products.productId": productId
                    }, {
                        $inc: {
                            "products.$.quantity": productquantity,
                            "products.$.totalPrice": productquantity * existProduct.productPrice
                        }
                    })
                } else {
                //    add new product to cart 
                await Cart.findOneAndUpdate({userid:userId   },
                    {
                        $push:{
                            products:{
                                productId: productId,
                                quantity: productquantity,
                                productPrice: productData.price,
                                totalPrice: productquantity *productData.price
                            }
                        }
                    }
                    
                    )
                }
            } 
            
            
            else { // create bew cart  here am adding new product to cart
                const newCart = new Cart({
                    userid: userId,
                    products: [
                        {
                            productId: productId,
                            quantity: productquantity,
                            productPrice: productData.price,
                            totalPrice: productquantity *productData.price
                        }
                    ]
                })
                await newCart.save();
            }
            res.json({success: true});
        }

    } catch (err) {
        console.log(err.message)
    }
}


module.exports = {
    loadCart,
    addtoCart
}
