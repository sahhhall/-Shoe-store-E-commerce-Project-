const express = require('express');
const userRouter = express();
const userController = require('../controllers/userController')
const session = require("express-session");
const config = require('../config/config')
const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController')
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



//////////////////////////////////////////shop view product detailed view/////////////////

userRouter.get('/shop',productController.loadShop);

userRouter.get('/productView',productController.productView);

// userRouter.get('/product-details',productController.productDetails)


userRouter.get('/profile',userController.loadProfile);
userRouter.get('/addresses',userController.loadAddressManage)
userRouter.get('/orders',orderController.loadOrder);

userRouter.post('/edit-profile',userController.editProfile);
userRouter.post('/reset-pass',userController.resetPasswithOld)
userRouter.post('/add-address',userController.addAddress)
userRouter.post('/edit-addresses',userController.editAddress)
userRouter.post('/remove-addresses',userController.deleteAddress);

//===============================CART HANDLING=================================//


userRouter.get('/cart',auth.authlogg,cartController.loadCart);
userRouter.post('/add-to-cart',cartController.addtoCart)
userRouter.post('/removeCartitem',auth.authlogg,cartController.removeCartItem)

//================================CHECKOUT HANDLING============================//
userRouter.get('/check-out',auth.authlogg,cartController.loadCheckOut);

//================================ORDER HANDLING============================//

userRouter.post('/place-order',auth.authlogg,orderController.placeOrder)
userRouter.get('/order-success/:orderId',auth.authlogg,orderController.loadSuccess);
userRouter.get('/viewOrderDetails',auth.authlogg,orderController.userOderDetails);

userRouter.post('/cancel-order',auth.authlogg,orderController.cancelOrder);
userRouter.post('/returnreason',auth.authlogg,orderController.returnReason);



userRouter.get('/about-us',userController.aboutUs);
userRouter.get('/contact',userController.contactPage);
// userRouter.get('*',(req,res)=>{
//     res.redirect('/')
// })
// userRouter.get('*', function(req, res){
//     res.status(404).render('404notfound');
//   });
module.exports = userRouter;
