const Banner = require('../models/bannerModel')


const loadbanner = async (req, res) => {
    try {
        const listedBanners = await Banner.find();
        console.log("listed banners here")
        res.render('banner', {banner: listedBanners})
    } catch (err) {
        console.log(err.message)
    }
}

const loadAddBannerPage = async (req, res) => {
    try {
        res.render('addBanner')
    } catch (err) {
        console.log(err.message)
    }
}

const addBannner = async (req, res) => {
    try {
        const image = req.file.filename;
        const banner = new Banner({
             title: req.body.title,
             description: req.body.description, 
             image: req.file.filename, 
             status: true
        })

        let result = await banner.save();
        if(result){
            res.redirect('/admin/banners')
          }else{
            console.log('not added in db');
          }

    } catch (err) {
        console.log(err.message)
    }
}


const editBannerPageload = async(req,res)=>{
    try{
        const bannerid = req.query.id;
        const bannerSpecific = await Banner.findById(bannerid)
        console.log("here am",bannerSpecific);
        res.render('editBanner',{banner:bannerSpecific})

    }catch(err){
        console.log(err.message)
    }
}


const editBannerPost = async(req,res)=>{
    try{
        console.log("hi her nothing to i achive 8 lpa job in it")
        const bannerid = req.query.id;
        const bannerSpecific = await Banner.findById(bannerid)
        await Banner.findById({bannerSpecific},
          {
            $set:{
                title: req.body.title,
                description: req.body.description, 
                image: req.file.filename, 
             
            }
          }  
            )
            res.redirect('/admin/banners')
    }catch(err){
        console.log(err.message)
    }
}


module.exports = {
    loadbanner,
    loadAddBannerPage,
    addBannner,
    editBannerPageload,
    editBannerPost
}
