

const loadMessageAdmin = async(req, res) => {
    try {
        res.render('messages')
    } catch (error) {
        console.log(error)
    }
}



module.exports = {
    loadMessageAdmin
}