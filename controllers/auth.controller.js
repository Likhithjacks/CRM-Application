const User=require("../models/user.model")
const {userTypes,userStatus}=require("../utils/constants")
const bcrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")
const config=require("../configs/auth.config")
async function signup(req,res){
    let status;
    if(req.body.userType==userTypes.engineer || req.body.userType==userTypes.admin){
        status=userStatus.pending
    }
    else{
        status=userStatus.approved
    }
    const userObj = {
        name: req.body.name,
        userId: req.body.userId,
        email: req.body.email,
        userType: req.body.userType,
        password: bcrypt.hashSync(req.body.password, 8),
        userStatus: status
    }
        try {
            const userCreated = await User.create(userObj)
            const postReponse = {
                name: userCreated.name,
                userId: userCreated.userId,
                email: userCreated.email,
                userType: userCreated.userType,
                userStatus: userCreated.userStatus,
                createdAt: userCreated.createdAt,
                updatedAt: userCreated.updatedAt
            }
            res.status(201).send(postReponse)
        } catch (err) {
            console.log("Something went wrong while saving to DB", err.message)
            res.status(500).send({
                message: "Some internal error while inserting the element"
            })
        }
    }
async function signin(req, res){
    console.log(User)
        const user = await User.findOne({ userId: req.body.userId })
        console.log("user",user)
        if (!user) {
            res.status(400).send({
                message: "Failed! Userid doesn't exist!"
            })
            return
        }
        if (user.userStatus!=userStatus.approved) {
            res.status(403).send({
                message: `Can't allow login as user is in status : [${user.userStatus}]`
            })
            return
        }
    
        let passwordIsValid = bcrypt.compareSync(
            req.body.password,
            user.password
        )
    
        if (!passwordIsValid) {
            res.status(401).send({
                message: "Invalid Password!"
            })
            return
        }
    
        let token = jwt.sign({ userId: user.userId }, config.secret, {
            expiresIn: 86400 // 24 hours
        })
    
        res.status(200).send({
            name: user.name,
            userId: user.userId,
            email: user.email,
            userTypes: user.userType,
            userStatus: user.userStatus,
            accessToken: token
        })
    }
module.exports={signup,signin}