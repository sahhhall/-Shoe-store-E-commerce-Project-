const Order = require('../models/orderSchema')
const Cart = require('../models/cartSchema')


const loadCouponPage = async(req,res)=>{
    try{
        res.render('couponsPage')
    }catch(err){
        console.log(err.message)
    }

}



module.exports = {
    loadCouponPage,

}