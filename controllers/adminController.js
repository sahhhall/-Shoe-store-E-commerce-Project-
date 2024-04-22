const {name} = require('ejs');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const Category = require('../models/categoriesModel')
const securePassword = async (password) => {
    try {
        const securePass = await bcrypt.hash(password, 10);
        return securePass;
    } catch (err) {
        console.log(err.message)
    }
}

const loadLogin = async (req, res) => {

    try {
        res.render('adminLogin');
    } catch (error) {
        console.log(error.message)
    }
}

const verifyLogin = async (req, res) => {
    try {
        const {email, password} = req.body;
        console.log(email);
        const admin = await User.findOne({email: email});

        if (admin) {
            if (admin.is_admin !== 0) {
                const passwordMatch = await bcrypt.compare(password, admin.password);
                if (passwordMatch) {
                    req.session.admin = {
                        _id: admin._id,
                        email: admin.email,
                        name: admin.name

                    };
                    console.log(admin.name);

                    res.redirect('/admin/home');

                } else {
                    req.flash('error', 'Incorrect password.');
                    res.redirect('/admin/')
                }

            } else {
                req.flash('error', 'you are not a admin.');
                res.redirect('/admin/')

            }

        } else {
            req.flash('error', 'not even registerd.');
            res.redirect('/admin/')
        }
    } catch (err) {
        console.log(err.message)
    }
};
const loadDashboard = async (req, res) => {
    try {

        res.render('adminDashboard', {});
    } catch (error) {
        console.log(error.message)
    }
}

// =========================================< User Management >=================================================


// to load user
const loadUserMangment = async (req, res) => {
    try {
        let search = '';
        if (req.query.search) {
            search = req.query.search;
        }

        // pagination 
        let page =  1;
        if(req.query.page){
            page = req.query.page
        }
        let limit = 6;
        let previous = (page > 1) ? page - 1 : 1;
        let next = page + 1;

        const userData = await User.find({
                is_admin: 0,
                $or: [{
                    name: {
                        $regex: '.*' + search + '.*'
                    }
                }]
            })
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        const count = await User.find({
            is_admin: 0
        }).countDocuments();

        totalPages = Math.ceil(count / limit);
        if (next > totalPages) {
            next = totalPages;
        }
        res.render('userManagment', {
            users: userData,
            totalPages:totalPages,
            currentPage: page,
            previous: previous,
            next: next
        });
    } catch (err) {
        console.log(err.message);
    }
};

// to block user

const blockUser = async (req, res) => {
    try {

        const {userId} = req.body
        const userData = await User.findById(userId)

        await User.findByIdAndUpdate(
            userId,
            {
                $set:{
                    is_blocked:!userData.is_blocked
                }
            }
        )
        res.json({block: true})

    } catch (error) {
        console.log(error.message);

    }
}

const adminLogout = async (req, res) => {
    try {
        req.session.admin = false;

        res.redirect('/admin')

    } catch (err) {
        console.log(err.message)
    }
}


module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    loadUserMangment,
    blockUser,
    adminLogout
}
