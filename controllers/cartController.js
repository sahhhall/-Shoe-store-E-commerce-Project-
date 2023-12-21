const User = require('../models/userModel');
const  bcrypt = require('bcrypt');
const Category = require('../models/categoriesModel');
const Product = require('../models/productSchema')



const loadCart = async (req,res)=>{
    try{
        res.render('cartPage');
    }catch(err){
        console.log(err.message);
    }
}
const addtoCart = async(req,res)=>{
    try{

            const userId = req.session.user._id;
          
            if (userId === undefined) {
                res.json({ login: true, message: "Please login and continue shopping!" });
                res.redirect('/signin');
              }
           

    }catch(err){
        console.log(err.message)
    }
}




module.exports ={
    loadCart,
    addtoCart
}