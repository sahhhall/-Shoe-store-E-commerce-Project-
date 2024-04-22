const Order = require('../models/orderSchema')
const Cart = require('../models/cartSchema')
const Coupon = require('../models/couponnModel')

const loadCouponPage = async(req,res)=>{
    try{
        const coupons = await Coupon.find();
        res.render('couponsPage',{coupons: coupons})

    }catch(err){
        console.log(err.message)
    }

}


const loadAddCoupon = async(req,res)=>{
    try{
        res.render('addCoupon');
    }catch(err){
        console.log(err.messgae);
    }
}

const addCoupon = async(req,res)=>{

    try{
    const coupon = new Coupon({
        couponName : req.body.couponName,
        couponCode : req.body.couponCode,
        discountAmount : req.body.discount,
        minAmount : req.body.criteriaAmount,
        expiryDate : req.body.expiryDate,
        usersLimit : req.body.usersLimit,

    })

     await coupon.save();
    res.redirect('/admin/coupons')
    }catch(err){
        console.log(err.messgae);
    }
}
const deactivateCoupon = async (req, res) => {
    try {
        const { couponId } = req.body;
        console.log("am herererere");

        const couponData = await Coupon.findById(couponId);
        await Coupon.findByIdAndUpdate(
            couponId,
            {
                $set:{
                    status:!couponData.status
                }
            }
        )
        res.json({ block: true });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    loadCouponPage,
    loadAddCoupon,
    addCoupon,
    deactivateCoupon

}