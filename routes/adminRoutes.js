const express = require('express');

const adminRoute = express();
const session = require("express-session");
const adminController = require('../controllers/adminController')
const config = require('../config/config')
const categoryController = require('../controllers/categoryController')
const productController = require('../controllers/productController')
const orderController = require('../controllers/orderController')
const auth = require('../middlewares/adminAuth')
const multer = require('../middlewares/multerConfig');
const {isLogin} = require('../middlewares/userAuth');


adminRoute.use(session({secret: config.sessionSecret, resave: false, saveUninitialized: false}))


adminRoute.use(express.json());
adminRoute.use(express.urlencoded({extended: true}));


adminRoute.set('view engine', 'ejs');
adminRoute.set('views', './views/admin')


adminRoute.get('/', auth.isLogout, adminController.loadLogin);

adminRoute.post('/', adminController.verifyLogin);

adminRoute.get('/home', auth.isLogin, adminController.loadDashboard);

adminRoute.get('/logout', auth.isLogin, adminController.adminLogout);
// =========================================< User Management  >=================================================

adminRoute.get('/ums', auth.isLogin, adminController.loadUserMangment)
adminRoute.post('/blockUser', adminController.blockUser)


// =========================================< categotry managment  >=================================================


adminRoute.get('/categories', auth.isLogin, categoryController.loadCategory);

adminRoute.get('/createCategory', auth.isLogin, categoryController.loadaAddCategory);

adminRoute.post('/categories', categoryController.insertCategory);

adminRoute.post('/delete-category', categoryController.deleteCategory)

adminRoute.post('/list-unlist', categoryController.listUnlistCategory)

adminRoute.get('/edit-category', auth.isLogin, categoryController.editCategorypageLoad)

adminRoute.post('/edit-category', categoryController.editCategory)


// =========================================<  products >=================================================


adminRoute.get('/products', auth.isLogin, productController.loadProductList);

adminRoute.post('/list-unlist-product', productController.listUnlistProduct)

adminRoute.get('/edit-product', auth.isLogin, productController.editProductpageLoad);

adminRoute.post('/edit-product', multer.array('images'), productController.editProduct);

adminRoute.get('/addProduct', auth.isLogin, productController.loadAddproduct);

adminRoute.post('/addproduct', multer.array('images'), productController.addProduct)


// =========================================< orders >================================================= //


adminRoute.get('/orders',auth.isLogin,orderController.loadOrderlist);
adminRoute.get('/status-update',auth.isLogin,orderController.statusUpdate);



module.exports = adminRoute;
