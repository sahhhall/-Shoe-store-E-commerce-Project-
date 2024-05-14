const mongoDb = require("./config/mongodb");
mongoDb.connectDB();

const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const app = express();
const path = require("path");
const nocache = require("nocache");
const flash = require("express-flash");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");

const server = http.createServer(app);
const io = new socketIO.Server(server);

app.use(nocache());
app.use("/static", express.static(path.join(__dirname, "public/assets")));
app.use(
  "/assets",
  express.static(path.join(__dirname, "public/assets/images"))
);
app.use(flash());

app.use("/", userRoutes);
app.use("/admin", adminRoutes);

app.use("*", (req, res) => {
  res.status(404).render(path.join(__dirname, "views/users/404notfound.ejs"));
});

io.on("connection", (socket) => {
  console.log("user connceted server");
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
  socket.on("message", (message) => {
    console.log("Received message:", message);
    io.emit("message", message);
    io.emit("to_admin", message )
  });   
});

const port = process.env.PORT || 2001;
server.listen(port, () => {
  console.log(`Server is connected at http://localhost:${port}/`);
});
