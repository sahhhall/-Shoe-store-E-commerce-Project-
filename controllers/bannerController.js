const Banner = require("../models/bannerModel");
const sharp = require("sharp");
const path = require("path");

const loadbanner = async (req, res) => {
  try {
    const listedBanners = await Banner.find();
    console.log("listed banners here");
    res.render("banner", { banner: listedBanners });
  } catch (err) {
    console.log(err.message);
  }
};

const loadAddBannerPage = async (req, res) => {
  try {
    res.render("addBanner");
  } catch (err) {
    console.log(err.message);
  }
};

const listUnlistBanner = async (req, res) => {
  try {
    console.log("here for listnlist");
    const bannerId = req.body.status;
    const bannerSts = await Banner.findById(bannerId);
    console.log(bannerSts);
    if (bannerSts.status) {
      await Banner.findByIdAndUpdate(
        {
          _id: bannerId,
        },
        {
          $set: {
            status: false,
          },
        }
      );
    } else {
      await Banner.findByIdAndUpdate(
        { _id: bannerId },
        { $set: { status: true } }
      );
    }

    res.json({ list: true });
  } catch (err) {
    console.log(err.message);
  }
};

const addBannner = async (req, res) => {
  try {
    const image = req.file.filename;
    const { title, bannerLink, description } = req.body;
    console.log(image);
    const resizedImageBuffer = await sharp(req.file.path)
      .resize(1600, 900)
      .toBuffer();

    const imagePath = path.join(
      __dirname,
      "..",
      "public",
      "assets",
      "images",
      "banners",
      "sharped",
      image
    );
    await sharp(resizedImageBuffer).toFile(imagePath);

    const banner = new Banner({
      title: title,
      description: description,
      image: image,
      url: bannerLink,
      status: true,
    });

    let result = await banner.save();
    if (result) {
      res.redirect("/admin/banners");
    } else {
      console.log("not added in db");
    }
  } catch (err) {
    console.log(err.message);
  }
};

const editBannerPageload = async (req, res) => {
  try {
    const bannerid = req.query.id;
    const bannerSpecific = await Banner.findById(bannerid);
    console.log("here am", bannerSpecific);
    res.render("editBanner", { banner: bannerSpecific });
  } catch (err) {
    console.log(err.message);
  }
};
const editBannerPost = async (req, res) => {
  try {
    console.log("hi her nothing to i achive 8 lpa job in it", req.file);
    const { title, description, id } = req.body;
    console.log(id);
    var img;
    if (req.file) {
      img = req.file.filename;
      const resizedImageBuffer = await sharp(req.file.path)
        .resize(1600, 900)
        .toBuffer();

      const imagePath = path.join(
        __dirname,
        "..",
        "public",
        "assets",
        "images",
        "banners",
        "sharped",
        img
      );
      await sharp(resizedImageBuffer).toFile(imagePath);
    } else {
      const findBanner = await Banner.findById(id); // Pass id directly
      img = findBanner.image;
    }
    console.log("img", img);
    await Banner.findByIdAndUpdate(
      {
        _id: id,
      },
      {
        $set: {
          title: title,
          description: description,
          image: img,
        },
      }
    );
    res.redirect("/admin/banners");
  } catch (err) {
    console.log(err.message);
  }
};


// this for user side bannner rendering

module.exports = {
  loadbanner,
  loadAddBannerPage,
  listUnlistBanner,
  addBannner,
  editBannerPageload,
  editBannerPost,
};
