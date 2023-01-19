
const Sequelize = require('sequelize');
require('dotenv').config()
const {DB_HOST,DB_PORT,DB_USERNAME,DB_PASS,DB_NAME} = process.env;
console.log("database Host =======>>>>>", DB_HOST)
console.log("Database users ========>>>>",DB_USERNAME)
const sequelize =  new Sequelize(DB_NAME,DB_USERNAME,DB_PASS,{
    dialect: 'postgres',
    host:DB_HOST,
    port:DB_PORT
})

module.exports = sequelize 
