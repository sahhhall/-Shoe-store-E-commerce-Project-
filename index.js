const mongoDb = require('./config/mongodb');
mongoDb.connectDB();


const express = require('express');
const app = express();
const path = require('path');
const nocache = require('nocache');
const flash = require('express-flash');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');


app.use(nocache());
app.use('/static', express.static(path.join(__dirname, 'public/assets')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets/images')));
app.use(flash());


app.use('/', userRoutes);
app.use('/admin', adminRoutes);


app.use('*', (req, res) => {
    res.status(404).render(path.join(__dirname, 'views/users/404notfound.ejs'));
});


const port = process.env.PORT || 2001;
app.listen(port, () => {
    console.log(`Server is connected at http://localhost:${port}/`);
});
