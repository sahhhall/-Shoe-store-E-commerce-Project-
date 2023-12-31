const multer = require("multer");
const path = require("path");
const bannerStorage = multer.diskStorage({
    destination :function(req,file,cb){
        cb(null, path.join(__dirname, '../public/assets/images/banners'), function (err, success) {
            if (err) {
                throw err;
            }
        });
    },
    filename: function (req, file, cb) {
      cb(
        null,
        file.fieldname + "-" + Date.now() + path.extname(file.originalname)
      );
    },
})

const bannerUpload = multer({storage:bannerStorage});
module.exports = bannerUpload;
