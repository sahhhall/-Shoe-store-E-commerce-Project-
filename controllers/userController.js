const User = require('../models/userModel');
const userOtpVerification = require('../models/userOTPverification')
const Category = require('../models/categoriesModel')
const Token = require('../models/tokenModel');
const crypto = require("crypto");
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const Product = require('../models/productSchema');
const { profile, log } = require('console');
dotenv.config();


// password securindhs
const securePassword = async (password) => {

    try {
        const securePass = await bcrypt.hash(password, 10);
        return securePass;
    } catch (error) {
        console.log(error.message)
    }
}


// load home
const loadHome = async (req, res) => {
    try {
        const categories = await Category.find({is_listed: 1});
        const products = await Product.find({is_Listed: 1})
        res.render('homepage', {
            category: categories,
            product: products
        })
    } catch (err) {
        console.log(err.message)
    }
}


// load signin page
const loadLogin = async (req, res) => {
    try {
        const categories = await Category.find({});
        res.render('login', {category: categories})
    } catch (error) {
        console.log(error.message)
    }
}

// load sign up page

const loadSignup = async (req, res) => {
    try {
        const categories = await Category.find({is_listed: 1});
        res.render('signup', {category: categories})
    } catch (err) {
        console.log(err.message)
    }
}


// inser user sign up /

const insertUser = async (req, res) => {
    try {
        console.log(req.body);
        const email = req.body.email;
        const namee = req.body.name;
        const finduser = await User.findOne({email: email});
        const findUserbyname = await User.findOne({name: namee});
        if (finduser) {
            req.flash('exist', 'User already exists with this email');
            res.redirect('/signup')

        } else if (findUserbyname) {
            req.flash('usernameexist', 'Sorry, the username is already taken');
            res.redirect('/signup')

        } else {
            const securePass = await securePassword(req.body.password);
            const user = new User({
                name: req.body.name,
                email: req.body.email,
                mobile: req.body.mobile,
                password: securePass,
                is_admin: 0,
                blocked: 0,
                verified: 0
            });
            // const userData =await user.save();
            await user.save()

            sendOTPverificationEmail(user, res);

            // if (userData) {
            //     req.session.user = userData.name;
            //     res.render("signup");
            // } else {
            //     res.render("signup");
            // }}
        }
    } catch (error) {
        console.log(error.message)
    }
}


const sendOTPverificationEmail = async ({
    email
}, res) => {
    try {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'sahalvavoor313@gmail.com',
                pass: 'gudy lrvd rmpd vpkp'
            }
        });

        otp = `${
            Math.floor(1000 + Math.random() * 9000)
        }`;

        // mail options
        const mailOptions = {
            from: 'sahalvavoor313@gmail.com',
            to: email,
            subject: "Verify Your email",
            html: `Your OTP is: ${otp}`
        };

        // hash the otp
        const saltRounds = 10;
        const hashedOTP = await bcrypt.hash(otp, saltRounds);

        const newOtpVerification = await new userOtpVerification({email: email, otp: hashedOTP});
        console.log(newOtpVerification)
        // save otp record
        await newOtpVerification.save();
        await transporter.sendMail(mailOptions);

        res.redirect(`/otp?email=${email}`);

    } catch (err) {
        console.log(err.message);
    }
};

const loadOtp = async (req, res) => {
    try {
        const email = req.query.email;


        console.log(email)

        res.render('otpVerification', {email: email});

    } catch (error) {
        console.log(error);

    }
}

const verifyOtp = async (req, res) => {
    try {
        const email = req.body.email;

        console.log('email', req.body.email);
        const otp = req.body.digit1 + req.body.digit2 + req.body.digit3 + req.body.digit4;

        const userVerification = await userOtpVerification.findOne({email: email});
        console.log('userVerification:', userVerification);

        if (! userVerification) {
            console.log("otp expired")
            req.flash('error', 'otp expired');
            res.redirect('/signin')

            return;
        }

        const {otp: hashedOtp} = userVerification;

        const validOtp = await bcrypt.compare(otp, hashedOtp);
        console.log(validOtp);


        if (validOtp) {
            const userData = await User.findOne({email: email});

            if (userData) {
                await User.findByIdAndUpdate({
                    _id: userData._id
                }, {
                    $set: {
                        verified: true
                    }
                });
            }

            // delete theOTPrecord
            const user = await User.findOne({email: email})
            await userOtpVerification.deleteOne({email: email});
            if (user.verified) {
                if (! user.is_blocked) {
                    req.session.user = {
                        _id: user._id,
                        email: user.email,
                        name: user.name

                    };
                    console.log(user.name);

                    res.redirect('/');
                } else {
                    console.log("user blocked from this site");


                    req.flash('error', 'you are blocked from this contact with admin');
                    res.redirect('/signin')

                }

            }
        } else {
            console.log("whyyy")

            req.flash('error', 'otp is incorrect you have to verifey again login to get otp');
            res.redirect('/signin')

        }

    } catch (error) {
        console.log(error);
    }
};


// /////////////////////// resend otp
const resendOtp = async (req, res) => {
    try {

        const userEmail = req.query.email;
        await userOtpVerification.deleteMany({email: userEmail});
        console.log(userOtpVerification)
        console.log("User Email:", userEmail);
        if (userEmail) {
            sendOTPverificationEmail({
                email: userEmail
            }, res);
        } else {

            console.log("User email not provided in the query");

        }

    } catch (error) {
        console.log(error);

    }
}


// logiintohome
const verifyLogin = async (req, res) => {

    try {

        const {email, password} = req.body
        console.log(email)
        const user = await User.findOne({email: email})
        console.log('user:', user);

        if (user) {
            const passwordMatch = await bcrypt.compare(password, user.password)
            if (passwordMatch) {
                if (user.verified) {
                    if (! user.is_blocked) {
                        req.session.user = {
                            _id: user._id,
                            email: user.email,
                            name: user.name,
                            phone: user.mobile
                        };
                        console.log(user.name);
                        console.log(user.phone);
                        res.redirect('/');
                    } else {
                        console.log("user blocked from this site");

                        req.flash('error', 'you are bloocked from this contact with admin');
                        res.redirect('/signin')

                    }

                } else {
                    console.log("sd")
                    sendOTPverificationEmail(user, res);

                }
            } else {
                const categories = await Category.find({is_listed: 1});

                req.flash('error', 'incorrect password.');
                res.redirect('/signin')

            }
        } else {
            req.flash('error', 'no users found');
            res.redirect('/signin')

        }

    } catch (error) {
        console.log(error);
    }
}


const userLogout = async (req, res) => {
    try {
        req.session.user = false

        res.redirect('/')

    } catch (err) {
        console.log(err.message)
    }
}


// forget pass
const loadForgetpass = async (req, res) => {
    try {
        res.render('forgottenPass')
    } catch (err) {
        console.log(err.message)
    }
}


const sendResetPass = async (email, res) => {
    try {
        email = email
        const user = await User.findOne({email: email});
        console.log("this what usrsend reset pass", user);
        if (! user) 
            return res.status(400).send("user with given email doesn't exist");
        

        let token = await Token.findOne({userId: user._id});
        if (! token) {
            token = await new Token({userId: user._id, token: crypto.randomBytes(32).toString("hex")}).save();
        }

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'sahalvavoor313@gmail.com',
                pass: 'gudy lrvd rmpd vpkp'
            }
        });

        const resetpage = `http://localhost:4001/resetpassword/${
            user._id
        }/${
            token.token
        }`;

        const mailOptions = {
            from: 'sahalvavoor313@gmail.com',
            to: email,
            subject: "Verify Your email",
            html: `Your link here to reset pass ${resetpage}`
        };
        await transporter.sendMail(mailOptions);


    } catch (err) {
        console.log(err.message);
    }
};


const sentResetpass = async (req, res) => {
    try {
        const email = req.body.mail;
        // console.log("mail",mail);
        await sendResetPass(email, res);
        req.flash('success', 'we sented a reset password link');
        res.redirect('/signin')

    } catch (err) {
        console.log(err.message)
    }
}

// reset password page link

const resetPage = async (req, res) => {
    try {
        const userId = req.params.userId;
        const token = req.params.token;
        console.log("this what i want", userId, token);
        const categories = await Category.find({is_listed: 1});
        res.render('resetPassword', {
            category: categories,
            userId,
            token
        })
    } catch (err) {
        console.log(err.message)
    }
}
const resetPassword = async (req, res) => {
    try {
        const user = req.body.userId;
        console.log("it is my user", user);
        const userId = await User.findById(req.body.userId);
        const {email} = userId;

        const token = req.body.token;

        console.log(userId);

        if (! userId) {
            return res.status(400).send("Invalid link or expired");
        }
        const tokenDoc = await Token.findOne({
            userId: userId._id, // Use userId._id directly
            token: token
        });

        console.log("Working a bit", token);

        if (! tokenDoc) {
            return res.status(400).send("Invalid link or expired");
        }
        let password = req.body.confirmpassword;
        const securePass = await securePassword(password);
        console.log("this is the last steo if secs", securePass);

        await User.updateOne({
            email: email
        }, {
            $set: {
                password: securePass
            }
        });


        req.flash('success', 'successfully setted new passwird');
        res.redirect('/signin')

    } catch (err) {
        console.log(err.message);
        res.status(500).send("Internal Server Error");
    }
};



const aboutUs = async (req, res) => {
    try {
        res.render('about-us')
    } catch (err) {
        console.log(err.message)
    }
}

const contactPage = async (req, res) => {
    try {
        res.render('contactPage')
    } catch (err) {
        console.log(err.message)
    }
}



// =========================================< Profile >=================================================

const loadProfile = async (req,res)=>{
    try{
        const userid = req.session.user._id;
        const user = await User.findById(userid)
        // console.log("user",user)
        res.render('profilePage',{user:user})

    }catch(err){
        console.log(err.message)
    }
}
const loadAddressManage = async(req,res)=>{
    try{
        const userid = req.session.user._id;

        const user = await User.findById(userid);
        const addresses = user.addresses;
    //    console.log("here i getted your  address",addresses)
        res.render('manageAddress',{addresses:addresses});
    }catch(err){
        console.log(err.message)
    }
}
const editProfile = async (req, res) => {
    try {
      const email = req.body.userEmail;
      const newUserName = req.body.updatedName;
      const newMobile = req.body.updatedMobile;
  
      const findUsernameExist = await User.find({ name: newUserName });
  
      if (findUsernameExist.length > 0) {
        res.json({ edited: false });
      } else {
        // console.log("Here I find a username that exists:", findUsernameExist);
  
        const user = await User.findOneAndUpdate(
          { email: email },
          { $set: { name: newUserName, mobile: newMobile } },
          { new: true }
        );
  
        // console.log("Updated User:", user);
        res.json({ edited: true, user: user });
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ edited: false, message: "Server error" });
    }
  };
  
  
// reset pssworfd with older one progile page 

const resetPasswithOld = async(req,res)=>{
    try{
           
        const { confirmPass, useremail, oldPass } = req.body;
    
        const user = await User.findOne({email: useremail });

        const passwordMatch = await bcrypt.compare(oldPass, user.password);
       
        if(!passwordMatch){
            res.json({res:false})
        }
        else{
            const passwordSame = await bcrypt.compare(oldPass, confirmPass);
            
            if (passwordSame || confirmPass === oldPass) {
                return res.json({ reseted: false });
            }
    
            else{
                const securePass = await securePassword(confirmPass);
                await User.findOneAndUpdate({email:useremail},{$set:{
                    password:securePass
                }})
                // console.log("amhere");
                res.json({ reseted: true});
    
            }
           
        }
    }catch(err){
console.log(err.message);
    }
}

// adding new addewssws 
const addAddress = async(req,res)=>{
    try{
        const {fullName, addressLine ,city, state , postcode,phone,userEmail}= req.body;
        const user =await User.findOne({email:userEmail})
        
        await User.findOneAndUpdate(
            { email: userEmail },
            {
                $push: {
                    addresses: {
                        name: fullName,
                        addressline : addressLine,
                        city: city,
                        state: state,
                        pincode: postcode,
                        phone: phone
                    }
                }
            }
        );

        // console.log("hihi am hte you usr ",user);
        //     console.log("am here how can i help you")
        //     console.log("here your all data",fullName,addressLine,city,state);
            res.json({added :true})
    }catch(err){
        console.log(err.message)
    }
}

// editig entire address  with post method 

const editAddress = async(req,res)=>{
    try{
        const userid = req.session.user._id;
        const {id,
            fullName,
            address,
            city,
            state,
            post,
            phone }=req.body;

            const updatedUser = await User.findOneAndUpdate(
                { _id: userid, "addresses._id": id },
                {
                    $set: {
                        "addresses.$.name": fullName,
                        "addresses.$.addressline": address,
                        "addresses.$.city": city,
                        "addresses.$.state": state,
                        "addresses.$.pincode": post,
                        "addresses.$.phone": phone,
                    },
                },
                { new: true } // Return the updated document
            );
            
            console.log(updatedUser, "here is your updated user");
            res.json({edited:true})
            
    }catch(err){
        console.log(err.message)
    }
}

const deleteAddress = async(req,res)=>{
    try{
console.log("hihi")
const userId = req.session.user._id;
        const { Addid} = req.body;
        console.log(Addid,"here we aere")

        await User.updateOne(
            { _id: userId },
            { $pull: { addresses: { _id: Addid } } }
        );

            res.json({deleted:true});
    }catch(err){
        console.log(err.message)
    }
}
const loadOrder = async(req,res)=>{
    try{
        res.render('ordersPage')
    }catch(err){
        console.log(err.message)
    }
}


module.exports = {
    loadLogin,
    loadHome,
    loadSignup,
    insertUser,
    verifyOtp,
    loadOtp,
    resendOtp,
    verifyLogin,
    userLogout,
    loadForgetpass,
    sentResetpass,
    resetPassword,
    resetPage,
    aboutUs,
    contactPage,
    loadProfile,
    loadAddressManage,
    loadOrder,
    editProfile,
    resetPasswithOld,
    addAddress,
    editAddress,
    deleteAddress


}
