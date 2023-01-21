const Ticket=require("../models/ticket.model")
const User=require("../models/user.model")
const constants=require("../utils/constants")
const objectConverter = require("../utils/objectConverter")
const sendEmail = require("../utils/Notificationclient.js")

exports.createTicket=async(req,res)=>{
    const ticketObject = {
        title: req.body.title,
        ticketPriority: req.body.ticketPriority,
        description: req.body.description,
        status: req.body.status,
        reporter: req.body.userId
    }
    console.log(ticketObject)
     const engineer = await User.findOne({
        userType: constants.userTypes.engineer,
        userStatus: constants.userStatus.approved
    })
    ticketObject.assignee = engineer.userId
    try {
        const ticket = await Ticket.create(ticketObject)
       
        if (ticket) {
            const user = await User.findOne({
                userId: req.body.userId
            })
            user.ticketsCreated.push(ticket._id)
            await user.save()
            engineer.ticketsAssigned.push(ticket._id)
            await engineer.save()
            sendEmail(ticket._id,
                `Ticket with id : ${ticket._id} created`,
                ticket.description,
                user.email + "," + engineer.email,
                user.email
            )
            res.status(201).send(objectConverter.ticketResponse(ticket))
        }
        else{
            console.log("ticket not created")
        res.status(500).send({
            message: 'ticket not created'
        })
        }
    } catch (err) {
        console.log("Some error happened while creating ticket", err.message)
        res.status(500).send({
            message: 'Some internal server error'
        })
    }
}

const canUpdate = (user, ticket) => {
    return user.userId == ticket.reporter ||
        user.userId == ticket.assignee ||
        user.userType == constants.userTypes.admin
}

exports.updateTicket = async (req, res) => {
    const ticket = await Ticket.findOne({ _id: req.params.id })

    const savedUser = await User.findOne({
        userId: req.body.userId
    })

    if (canUpdate(savedUser, ticket)) {
        ticket.title = req.body.title != undefined
            ? req.body.title
            : ticket.title
        ticket.description = req.body.description != undefined
            ? req.body.description
            : ticket.description
        ticket.ticketPriority = req.body.ticketPriority != undefined
            ? req.body.ticketPriority
            : ticket.ticketPriority
        ticket.status = req.body.status != undefined
            ? req.body.status
            : ticket.status
        ticket.assignee = req.body.assignee != undefined
            ? req.body.assignee
            : ticket.assignee
        await ticket.save()
        const engineer = await User.findOne({
            userId: ticket.assignee
        })

        const reporter = await User.findOne({
            userId: ticket.reporter
        })
        sendEmail(ticket._id,
            `Ticket with id: ${ticket._id} updated`,
            ticket.description,
            savedUser.email + ',' + engineer.email + "," + reporter.email,
            savedUser.email
        )

        res.status(200).send(objectConverter.ticketResponse(ticket))

    } else {
        console.log("Ticket update was attempted by someone without access to the ticket")
        res.status(401).send({
            message: "Ticket can be updated only by the customer who created it"
        })
    }
}


exports.getAllTickets=async(req,res)=>{
    const filterNeed={}
    if(req.query.status){
        filterNeed.status=req.query.status
    }
    const searchedUser=await User.findOne({userid:req.body.userId})
    if(searchedUser.userType==constants.userTypes.engineer){
           filterNeed.assignee=searchedUser.userId
    }
    else if(searchedUser.userType==constants.userTypes.customer){
        filterNeed.reporter=searchedUser.userId
    }
    const tickets=await Ticket.find(filterNeed)
    res.status(200).send(objectConverter.ticketListResponse(tickets))
}
exports.getOneTicket = async (req, res) => {
    const ticket = await Ticket.findOne({
        _id: req.params.id
    })

    res.status(200).send(objectConverter.ticketResponse(ticket))
}
