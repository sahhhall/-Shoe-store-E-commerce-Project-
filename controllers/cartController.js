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




module.exports ={
    loadCart
}