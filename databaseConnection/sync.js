
/* eslint-disable no-console */
require('dotenv').config()
require("../models/otp")
require("../models/tokens");
require("../models/unstackingRequest")

const sequelize = require('../databaseConnection/db')
const syncModelsWithDB = async () => {
    try {
        await sequelize.authenticate()
        await sequelize.sync({ alter: true })
        console.log('Models Sync Succesfully')
    } catch (error) {
        console.log('There is some error in syncing models', error)
    }
}
syncModelsWithDB()