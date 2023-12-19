const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const Category = require('../models/categoriesModel');
const Product = require('../models/productSchema')
const sharp = require('sharp');
const path = require('path');
const loadProductList = async (req, res) => {
    try {

        const products = await Product.find({});

        res.render('products', {products: products});

    } catch (err) {
        res.status(400).send("internal server error")
    }

}

// add product page load

const loadAddproduct = async (req, res) => {
    try {
        const categories = await Category.find({});
        console.log(categories)
        res.render('addProduct', {categories: categories});
    } catch (err) {
        console.log(err.message)
    }
}
const listUnlistProduct = async (req, res) => {
    try {
        console.log("hi am here in product list unlist")
        const userid = req.body.list;
        const productData = await Product.findOne({_id: userid});
        console.log("hi i product", productData);
        if (productData.is_Listed) {
            await Product.findByIdAndUpdate({
                _id: userid
            }, {
                $set: {
                    is_Listed: false
                }
            })
        } else {
            await Product.findByIdAndUpdate({
                _id: userid
            }, {
                $set: {
                    is_Listed: true
                }
            })
        }
        res.json({list: true});
    } catch (err) {
        console.log(err.message)
    }
}

const addProduct = async (req, res) => {
    try {
        console.log("sahal");


        let sizes = [];
        for (i = 0; i < req.body.sizes.length; i ++) {
            sizes[i] = req.body.sizes[i]
        }
        console.log("reqfiles", req.files);
        let arrimages = [];
        if (Array.isArray(req.files)) {
            for (let i = 0; i < req.files.length; i++) {
                arrimages[i] = req.files[i].filename;

                const outputPath = path.resolve(__dirname, '..', 'public', 'assets', 'images', 'productImage', 'sharped', `${
                    req.files[i].filename
                }`);

                await sharp(req.files[i].path).resize(500, 500).toFile(outputPath);
            }
        }

        console.log("dsafsdfdsf", arrimages)

        console.log(sizes);
        console.log(req.body.quantity);
        console.log(req.body.category);
        console.log("ssssss");

        const product = new Product({
            previous_price: req.body.previous_price,
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            sizes: sizes,
            category: req.body.category,
            stockQuantity: req.body.quantity,
            is_Listed: true,
            images: arrimages
        });

        await product.save();

        res.redirect('/admin/products')

    } catch (error) {
        console.error(error);
        res.status(500).send("internal server error");
    }
};
const editProductpageLoad = async (req, res) => {
    try {
        const id = req.query.id;
        const product = await Product.findById({_id: id});
        const categories = await Category.find({});
        console.log(categories)

        console.log("hifrom edit load");

        if (product) {
            res.render('editProduct', {
                productedit: product,
                categories: categories
            });
        } else {
            res.redirect('/admin/products')
        }


    } catch (err) {
        console.log(err.message)
    }
}
const editProduct = async (req, res) => {
    try {
        const id = req.body.id;
        const newName = req.body.name;
        const newDescription = req.body.description;
        const newPrice = req.body.price;
        const category = req.body.category;
        const stock = req.body.quantity;


        await Product.updateMany({
            _id: id
        }, {
            $set: {
                name: newName,
                description: newDescription,
                price: newPrice,
                category: category,
                stockQuantity: stock,
                previous_price: req.body.previous_price
            }
        });

        if (req.body.sizes && Array.isArray(req.body.sizes)) {
            await Product.updateMany({
                _id: id
            }, {
                $set: {
                    sizes: req.body.sizes
                }
            });
        }


        const arrimages = [];
        for (let i = 0; i < req.files.length; i++) {
            const outputPath = path.resolve(__dirname, '..', 'public', 'assets', 'images', 'productImage', 'sharped', `${
                req.files[i].filename
            }`);
            await sharp(req.files[i].path).resize(500, 500).toFile(outputPath);
            arrimages.push(req.files[i].filename);
        }

        await Product.findOneAndUpdate({
            _id: id
        }, {
            $set: {
                images: arrimages
            }
        });


        res.redirect('/admin/products');
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Internal server error");
    }
};


// //////////////////////////////////shop ui//////////////////


const loadShop = async (req, res) => {
    try {
        const categId = req.query.categid;


        const categories = await Category.find({is_listed: true});
        const listedCategoryNames = categories.map((category) => category.name);
        console.log('Listed Categories:', listedCategoryNames);
        // const products = await Product.find({ is_Listed: true });
        if (categId) {
            var products = await Product.find({is_Listed: true, category: categId})
        } else {
            var products = await Product.find({is_Listed: true})
        }
        console.log('Listed Products:', products);
        const listedProducts = products.filter((product) => {
            console.log('Product Category:', product.category);
            return product.is_Listed === true && listedCategoryNames.includes(product.category);
        });
        console.log('Filtered Products:', listedProducts);

        res.render('shop', {
            category: categories,
            products: listedProducts
        });
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Internal Server Error');
    }
};


// const productDetails = async(req,res)=>{
//     try{
//         const categories = await Category.find({ is_listed: 1 });
//         res.render('productDetails',{ category: categories });
//     }catch(err){
//         console.log(err.message)
//     }
// }

const productView = async (req, res) => {
    try {
        const categories = await Category.find({is_listed: 1});

        const queryProduct = req.query.id;
        const viewProduct = await Product.findById(queryProduct);
        const productDate = viewProduct.date;
        var firstWord = viewProduct.name.split(' ')[0];
        console.log(firstWord)


        const relatedProducts = await Product.find({
            category: viewProduct.category,
            _id: {
                $ne: viewProduct._id
            }
        });

        console.log("this is releated", relatedProducts);

        const currentDate = new Date();
        const timeDifference = currentDate - productDate;
        const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

        res.render('productDetails', {
            product: viewProduct,
            category: categories,
            daysDifference: daysDifference,
            relatedProducts: relatedProducts
        });

    } catch (err) {
        console.log(err.message);
    }
}


module.exports = {
    loadProductList,
    loadAddproduct,
    addProduct,
    listUnlistProduct,
    editProductpageLoad,
    editProduct,
    loadShop,
    //    productDetails,
    productView

};
