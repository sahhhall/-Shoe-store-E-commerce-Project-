const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const Category = require('../models/categoriesModel');
const Product = require('../models/productSchema')
const Cart = require('../models/cartSchema')


// =============================================LOAD CART PAGE=========================================================//
const loadCart = async (req, res) => {
    try {
        

        if (!req.session.user || !req.session.user._id) {
            req.flash("success","pleasee login to get our sevice")
           res.redirect('/signin')
        }else{
            const userId = req.session.user._id
          
                const cartDetails = await Cart.findOne({ userid: userId }).populate({path:'products.productId'});
                let  initialAmount =0;
                if(cartDetails){
                    cartDetails.products.forEach((item)=>{
                        let itemPrice = item.productPrice;
                        initialAmount += itemPrice *item.quantity
                    })
                }
                // const products = cartDetails.products;


            res.render('cartPage', { cartDetails, subTotal: initialAmount
             });
        }
      
    } catch (err) {
        console.log(err.message);
    }
}

// =============================================PRODUCT ADDING TO CART==================================================//
const addtoCart = async (req, res) => {
    try { // console.log(productData+"quantuty is"+productquantity);
        if (!req.session.user || !req.session.user._id) {
            return res.json({login: true, message: "Please login and continue shopping!"});
        } else {
            const userId = req.session.user._id;
            // const userData = await User.findOne({_id: userId});
            const {productId, productquantity} = req.body;
            const productData = await Product.findOne({_id: productId});
            const cart = await Cart.findOne({userid: userId});
            if (cart) { // we need to check the product exist or not because if exist we need onlu updation

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
                } else { //    add new product to cart
                    await Cart.findOneAndUpdate({
                        userid: userId
                    }, {
                        $push: {
                            products: {
                                productId: productId,
                                quantity: productquantity,
                                productPrice: productData.price,
                                totalPrice: productquantity *productData.price
                            }
                        }
                    })
                }
            } else { // create bew cart  here am adding new product to cart
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





const removeCartItem = async (req, res) => {
    try {
      const userId = req.session.user._id;
      const proId = req.body.product;
      console.log(userId);
  
      const cartData = await Cart.findOne({ userid: userId });
  
      console.log("am here");
  
      if (cartData) {
        await Cart.findOneAndUpdate(
          { userid: userId },
          {
            $pull: { products: { productId: proId } },
          }
        );
  
        console.log("am here too");
        res.json({ success: true });
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  


const loadCheckOut = async(req,res)=>{
    try{
      
        const userId = req.session.user._id
        const user = await User.findById(userId);
        const addresses = user.addresses;
        const cartDetails = await Cart.findOne({ userid: userId }).populate({path:'products.productId'});
        if (cartDetails.products.length<=0) {
            console.log("ddddd")
          res.redirect('/cart');
        }
      else{
        let  initialAmount =0;
        if(cartDetails){
            cartDetails.products.forEach((item)=>{
                let itemPrice = item.productPrice;
                initialAmount += itemPrice *item.quantity
            })
            
       
        } res.render('checkOutshipping',{cartDetails, subTotal: initialAmount,addresses:addresses});
      } 
        // const products = cartDetails.products;

    }catch(err){
        console.log(err.message)
    }
}
module.exports = {
    loadCart,
    addtoCart,
    loadCheckOut,
    removeCartItem
}
