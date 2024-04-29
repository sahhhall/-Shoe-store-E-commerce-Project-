const express = require('express');
const userRouter = express();
const userController = require('../controllers/userController')
const session = require("express-session");
const config = require('../config/config')
const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController')
const couponController = require('../controllers/couponController')
const wishlistController = require('../controllers/wishlist.controller')
const {loadCartMiddleware} = require('../middlewares/cartMiddle')
const auth = require('../middlewares/userAuth')
userRouter.use(session({secret:config.sessionSecret,resave:false,
    saveUninitialized:false,}))
userRouter.use((req, res, next) => {
        res.locals.user = req.session.user || null;
        res.locals.loggedIn = req.session.user ? true : false;
        next();
    });
    


userRouter.use(loadCartMiddleware)
userRouter.use(express.json());

userRouter.use(express.static('public'));
userRouter.use(express.urlencoded({extended:true}));
userRouter.set('view engine','ejs');
userRouter.set('views','./views/users')



userRouter.get('/',userController.loadHome);

userRouter.get('/signin',auth.isLogin,userController.loadLogin);

userRouter.get('/signup',auth.isLogOut,userController.loadSignup);

userRouter.post('/signup',userController.insertUser);

userRouter.get('/otp',auth.isLogOut,userController.loadOtp);

userRouter.post('/otp',userController.verifyOtp);

userRouter.post('/signin',userController.verifyLogin)

userRouter.post('/resend',userController.resendOtp)
// logout 
userRouter.get('/signout',userController.userLogout)
// forget pass ///////
userRouter.get('/forgetpass',auth.isLogOut,userController.loadForgetpass);

userRouter.post('/forgetpass',userController.sentResetpass);
// userRouter.get('/resetpassword',userController.resetPage);
userRouter.get('/resetpassword/:userId/:token',auth.isLogOut,userController.resetPage);

userRouter.post('/resetpassword',userController.resetPassword);



// =======================================< SHOP & PRODUCT DETAILD >============================================= //

userRouter.get('/shop',productController.loadShop);
// userRouter.get('/search',productController.searchProduct);
userRouter.get('/productView',productController.productView);
userRouter.post('/getProduct',productController.searchProduct);
// userRouter.get('/product-details',productController.productDetails)


// ==========================================< USER PROFILE >==================================================== //

userRouter.get('/profile',auth.userBlockCheck ,userController.loadProfile);

userRouter.get('/addresses' ,auth.userBlockCheck ,userController.loadAddressManage)

userRouter.get('/orders',auth.userBlockCheck ,orderController.loadOrder);

userRouter.post('/edit-profile',auth.userBlockCheck,userController.editProfile);

userRouter.post('/reset-pass',auth.userBlockCheck,userController.resetPasswithOld)

userRouter.post('/add-address',auth.userBlockCheck,userController.addAddress)

userRouter.post('/edit-addresses',auth.userBlockCheck,userController.editAddress)

userRouter.post('/remove-addresses',auth.userBlockCheck,userController.deleteAddress);

userRouter.get('/wallet',auth.userBlockCheck,userController.walletLoad);

userRouter.get('/wishlist',auth.userBlockCheck, wishlistController.loadWishlistPage);

userRouter.post('/invoice-download', orderController.downloadInvoice);


// ==========================================< CART HANDLING >==================================================== //

userRouter.get('/cart',auth.authlogg,cartController.loadCart);

userRouter.post('/add-to-cart',cartController.addtoCart)

userRouter.post('/removeCartitem',auth.authlogg,cartController.removeCartItem)
userRouter.post('/update-quantity',auth.authlogg,cartController.quantityUpdationCart)
userRouter.post('/remove-coupon', auth.authlogg, couponController.reomoveCoupon)
// =========================================< CHECKOUT HANDLING >================================================= //

userRouter.get('/check-out',auth.authlogg ,auth.userBlockCheck, cartController.loadCheckOut);
userRouter.post('/check-out',auth.authlogg ,auth.userBlockCheck, cartController.loadCheckOut);
userRouter.post('/apply-coupon',auth.authlogg ,auth.userBlockCheck, cartController.applyCoupon)

// ===========================================< ORDER HANDLING >================================================== //

userRouter.post('/place-order',auth.authlogg,orderController.placeOrder)

userRouter.get('/order-success/:orderId',auth.authlogg,auth.userBlockCheck , orderController.loadSuccess);

userRouter.post('/verify-payment', auth.authlogg,orderController.paymentVerfication);

userRouter.get('/viewOrderDetails',auth.authlogg,orderController.userOderDetails);

userRouter.post('/cancel-order',auth.authlogg,orderController.cancelOrder);

userRouter.post('/returnreason',auth.authlogg,orderController.returnReason);
userRouter.post('/retry-payment',auth.authlogg,orderController.retryPayment);


// ==========================================< wishlist >===================================================== //

userRouter.post('/add-to-wishlist', wishlistController.addToWishList);
userRouter.post('/remove-wishlist', wishlistController.removeFromWishlist);
// ==========================================<  >===================================================== //

userRouter.get('/about-us',userController.aboutUs);
userRouter.get('/contact',userController.contactPage);
// userRouter.get('*',(req,res)=>{
//     res.redirect('/')
// })
// userRouter.get('*', function(req, res){
//     res.status(404).render('404notfound');
//   });
module.exports = userRouter;
