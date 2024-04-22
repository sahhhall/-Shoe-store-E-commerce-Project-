const User = require('../models/userModel');
const  bcrypt = require('bcrypt');
const Category = require('../models/categoriesModel');
const Product = require('../models/productSchema')



// load add category 

const loadCategory = async(req,res)=>{
    try{
        const categories = await Category.find({});
        console.log(categories)
       res.render('categories',{categories:categories});
    }catch(err){
        console.log(err.message)
    }
}

const loadaAddCategory = async(req,res)=>{
    try{
        res.render('categoryadd')
    }catch(err){
        console.log(err.message)
    }
}





const insertCategory = async(req,res)=>{
    try{
            console.log(req.body);
                const {description,name} = req.body;

                const existingCategory = await Category.findOne({ name });
                if(existingCategory){
                        req.flash('error','already exists a category with this name')
                        res.redirect('/admin/createCategory')
                }else{
                    const category = new Category({
                
                        name:name,
                        description:description,
                        is_listed:1
        
                    })
                    
                await category.save();
                res.redirect('/admin/categories')
    }
                }
         

    catch(err){
        console.log(err.message)
    }
}

const deleteCategory = async(req,res)=>{
    try{
            const id = req.body.user;
            console.log("amheresdr",id);
            await Category.deleteOne({_id:id});
            res.json({list:true});
    }catch(err){
        console.log(err.message)
    }
}
const listUnlistCategory = async(req,res)=>{
    try{
       const {category} = req.body;
       const CategoryData = await Category.findById(category);
       await Category.findByIdAndUpdate(category,{
        $set:{
           is_listed: !CategoryData.is_listed
        }
       
    })
    //    passing success obj ////
       res.json({list:true});
      
    }catch(err){
        console.log(err.message)
    }
}

const editCategorypageLoad = async(req,res)=>{
    try{
            const id=req.query.id;
            const category=await Category.findById({_id:id});
            
            console.log("hifrom edit load",category.name);
            console.log("hifrom edit load",category.description);
            if(category){
                res.render('editCategory',{categoryedit :category});
            }
            else{
             res.redirect('/admin/categories')
            }
        

    }catch(err){
        console.log(err.message)
    }
}
const editCategory = async (req, res) => {
    try {
        
    const { _id,name,description } = req.body.id;
    
      console.log("hifrom edit page")
      const newName = req.body.editname;
      const newDescription = req.body.editdisc;
      console.log("hifrom edit page",newName,newDescription)
      const existingCategory = await Category.findOne({ name: req.body.editname });
      console.log(existingCategory)
      if(existingCategory){
      
        console.log("am here flash mesage")
       
        req.flash('error','error! alredy exixst a category with this name')
        res.redirect('/admin/categories');
      }else{
        
        await Category.findByIdAndUpdate({_id:req.body.id},{$set:{name:newName  ,description:newDescription}})
        res.redirect('/admin/categories');
      }
   
        
     
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
  };


  module.exports = {
    loadCategory,
    loadaAddCategory,
    insertCategory,
    deleteCategory,
    editCategory,
    listUnlistCategory,
    editCategorypageLoad,
    
  }