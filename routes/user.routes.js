const Router = require("express")
const UserController = require("../controller/user.controller")
const router = new Router()

router.get("/customer", UserController.getStatusPaid)

module.exports = router
