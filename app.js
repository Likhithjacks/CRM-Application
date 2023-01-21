const dbConfig = require("./configs/db.config")
const mongoose = require("mongoose")
const authController = require("./controllers/auth.controller")
const express = require('express')
const bcrypt=require("bcryptjs")
const authRouter=require("./routes/authroute")
const userRouter=require("./routes/userroute")
const ticketRouter=require("./routes/ticketroute")
const ticketController=require("./controllers/ticket.controller")
const User=require("./models/user.model")
const app = express()
const constants=require("./utils/constants")
mongoose.connect(dbConfig.DB_URL)
app.use(express.json())
const db = mongoose.connection
db.on("error", () => console.log("Can't connect to DB"))
db.once("open", () => {
    console.log("Connected to Mongo DB")
    init()
        })
authRouter(app)
ticketRouter(app)
userRouter(app)
async function init() {
    let user = await User.findOne({ userId: "admin" })
    if (user) {
        console.log("Admin user already present", user)
        return
    }
    try {
        let user = await User.create({
            name: "jack",
            userId: "admin",
            email: "admin@gmail.com",
            userType: "ADMIN",
            password: bcrypt.hashSync("Welcome1", 8),
            userStatus: constants.userStatus.approved
        })
        console.log(user)
    } 
    catch (err) {
        console.log(err.message)
    }
}
app.listen(3000, () => console.log("Listening at localhost:3000"))
