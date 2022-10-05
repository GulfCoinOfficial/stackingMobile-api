
const Sequelize = require('sequelize');
require('dotenv').config()
//const {DB_HOST,DB_PORT,DB_USERNAME,DB_PASS,DB_NAME} = process.env;
const DB_HOST = "localhost";
const DB_PORT = 5432;
const DB_USERNAME = "admin"; 
const DB_PASS = "root"; 
const DB_NAME = "hollaex";

// const DB_HOST = "localhost"
// const DB_PORT = 5432
// const DB_USERNAME = "asimmehmood"
// const DB_PASS = ""
// const DB_NAME = "hollaex"

console.log("database Host =======>>>>>", DB_HOST)
console.log("Database users ========>>>>",DB_USERNAME)
const sequelize =  new Sequelize(DB_NAME,DB_USERNAME,DB_PASS,{
    dialect: 'postgres',
    host:DB_HOST,
    port:DB_PORT
})

module.exports = sequelize 
