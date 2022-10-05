const MessenteApi = require('messente_api');
const sequelize = require('../databaseConnection/db');
require('dotenv').config()
const {Op} = require("sequelize")
const opt = require("../models/otp")
const token = require("../models/tokens");
const StackingAbi = require("../abi/stackingAbi.json");
const gulfAbi = require("../abi/gulfAbi.json");

//const {MESSENTEEUSERNAME, MESSENTEPASSWORD, SENDERNAME, EXPIRYMINUTES,GULFCONTRACTADDRESS,STACKINGCONTRACTADDRESS, PROVIDER} = process.env;

const MESSENTEEUSERNAME =  "31db1978157b47b1b2152230463ed4b5"
const MESSENTEPASSWORD =  "2860f632951c41b8a29b717afb5dfada"
const SENDERNAME = "GULF"

const EXPIRYMINUTES=2
const STACKINGCONTRACTADDRESS = "0x38A38c8C5BbdE52aE163aCAB4b9e1d24E23fbf51"
const GULFCONTRACTADDRESS="0xD5C3C4B4F80fFfd8E7a130F4846496BDa6035728"
const PROVIDER = "https://data-seed-prebsc-1-s1.binance.org:8545/"

const Web3 = require("web3")
const Provider = require('@truffle/hdwallet-provider');
module.exports = {
    sendMessage : (phoneNumber, code) => {
        return new Promise(resolve => {
            const defaultClient = MessenteApi.ApiClient.instance;
            const basicAuth = defaultClient.authentications['basicAuth'];
            basicAuth.username =  MESSENTEEUSERNAME 
            basicAuth.password =  MESSENTEPASSWORD
            const api = new MessenteApi.OmnimessageApi();
            const sms = MessenteApi.SMS.constructFromObject({
                sender: SENDERNAME ,
                text: `${code} is your verification code`,
            });
            const omnimessage = MessenteApi.Omnimessage.constructFromObject({
                messages: [sms],
                to: phoneNumber,
            });
            api.sendOmnimessage(omnimessage, (error, data) => {
            if (error) {
                resolve({status : 404, errors : error})
            } else {
                resolve({ status : 200, message_id : data.messages[0].message_id, omnimessage_id : data.omnimessage_id })
                console.log(data.messages[0].message_id);
                console.log(data.omnimessage_id)
            }
            });
        })
    },

    getWeb3Object : (privateKey) => {
        return new Promise(async(resolve) => {
            var provider = new Provider(privateKey, PROVIDER);
            var web3 = new Web3(provider);
            resolve(web3)
        })
    },

    codeVarification : async(code , user_id) => {
        return new Promise(async(resolve) => {
            let data = await opt.findOne({
                where: {
                    user_id,
                    code   
                }
            });
            if(data){
                let createDate = (data.toJSON()).updatedAt;
                var expireTime = new Date(createDate.getTime() + EXPIRYMINUTES*60000) 
                console.log("expirationDate ===>>>>>", expireTime);
                console.log("current time ====>>>> ", new Date())
                resolve(expireTime >= new Date() ? {status : 200, message: "Varified"}: {status: 404, message: "Not valid"})
            }else{
                resolve({status: 404, message: "Not valid"});
            }
        })
    },

    generateOPT: () => {
        let generatedNumber = (Math.floor(100000 + Math.random() * 900000)).toString();
        return generatedNumber
    },

    saveOTP : (code1, userId) => {
        return new Promise(async(resolve) => {
            opt.findOne({ 
                where: {
                    user_id : userId,
                },
            })
            .then(function(obj) {
                if(obj){
                    obj.update({
                        code: code1,
                        createdAt : new Date(),
                        updatedAt : new Date()
                    });
                }else{
                    opt.create({
                        user_id : userId,
                        code: code1,
                        createdAt : new Date(),
                        updatedAt : new Date()
                    });
                }
            })
            resolve(true)
        })
    },

    getContractObjectStacking : (web3) => {
        return new Promise(async(resolve) => {

            const contract = new web3.eth.Contract(StackingAbi, STACKINGCONTRACTADDRESS)
            resolve(contract)
        })
    },

    getContractObjectGulf : (web3) => {
        return new Promise(async(resolve) => {
            const contract = new web3.eth.Contract(gulfAbi , GULFCONTRACTADDRESS)
            resolve(contract)
        })
    },

    getWalletPrivateKey : (userId) => {
        return new Promise(async(resolve) => {
            let data = await token.findOne({ 
                where: {
                    user_id : userId,
                },
            })
            if(data){
                resolve({wallet : data.toJSON().key, privateKey: data.toJSON().secret});
            }else{
                resolve(false)
            }
        })
    },

    checkBalance : (walletAddress, contractObject, web3) => {
        return new Promise(async(resolve) => {
            try{
                let balance = await contractObject.methods.balanceOf(walletAddress).call()
                const bnbAmount = web3.utils.fromWei(balance, 'ether')
                resolve(bnbAmount)
            }catch(error){
                console.log(error)
            }
        })
    },

    stackeToken : (wallet, amount, package, stackingContractObject) => {
        return new Promise(async(resolve) => {
            try{
                console.log("========>>>>>>>>>>>>>>", amount)
                let data = await stackingContractObject.methods.stackToken( amount.toString() , package ).send({from : wallet});
                resolve( {status: 200, transactionHash : data.transactionHash})
            }catch(error){
                resolve({status:404, err : error.message})
            }
        })
    },

    transferAllow : (wallet, amount, gulfContractObject, web3) => {
        return new Promise(async(resolve) => {
            console.log("========>>>>>>>>>>>>>>", amount)
            let result = await gulfContractObject.methods.increaseAllowance(STACKINGCONTRACTADDRESS, web3.utils.toWei(amount.toString()) ).send({from : wallet})
            console.log("transfer allow Hash ====>>>>>", result.transactionHash);
            resolve((result.transactionHash) ? result.transactionHash : false);
        })
    },

    sendUnstackRequest : (stackingContractObject, wallet) => {
        return new Promise(async(resolve) => {
            try{
                let data = await stackingContractObject.methods.submitRequestForUnstack().send({from : wallet});
                resolve({status: 200, trasectionHash : data.transactionHash})
            }catch(error){
                resolve({status: 404, err : error.message})
            }
        })
    },

    sendRequestForClaims  : (stackingContractObject, wallet) => {
        return new Promise(async(resolve) => {
            try{
                let data = await stackingContractObject.methods.claimRewards().send({from : wallet});
                resolve({status: 200, trasectionHash : data.transactionHash})
            }catch(error){
                resolve({status: 404, err : error.message})
            }
        })
    },

    renewPackages: (stackingContractObject, wallet, newPackage) => {
        return new Promise(async(resolve) => {
            try{
                let data = await stackingContractObject.methods.renewPackage(newPackage).send({from : wallet});
                resolve({status: 200, trasectionHash : data.transactionHash})
            }catch(error){
                resolve({status: 404, err : error.message})
            }
        })
    },

    approvedRequest : (stackingContractObject, wallet, adminWallet) => {
        return new Promise(async(resolve) => {
            try{
                let data = await stackingContractObject.methods.approvedStackingRequest(wallet).send({from : adminWallet});
                resolve({status: 200, trasectionHash : data.transactionHash})
            }catch(error){
                resolve({status: 404, err : error.message})
            }
        })
    },

    updatePanality : (stackingContractObject, wallet, package, newPercentage) => {
        return new Promise(async(resolve) => {
            try{
                let data = await stackingContractObject.methods.updatePanalityPercentage(package, newPercentage).send({from : wallet});
                resolve({status: 200, trasectionHash : data.transactionHash})
            }catch(error){
                resolve({status: 404, err : error.message})
            }
        }) 
    },

    updateRewards : (stackingContractObject, wallet, package, newPercentage) => {
        return new Promise(async(resolve) => {
            try{
                let data = await stackingContractObject.methods.updateRewardPercentage(package, newPercentage).send({from : wallet});
                resolve({status: 200, trasectionHash : data.transactionHash})
            }catch(error){
                resolve({status: 404, err : error.message})
            }
        }) 
    },

    updateStackingPrice : (stackingContractObject, wallet, newPrice) => {
        return new Promise(async(resolve) => {
            try{
                let data = await stackingContractObject.methods.updateStackingPrice(newPrice).send({from : wallet});
                resolve({status: 200, trasectionHash : data.transactionHash})
            }catch(error){
                resolve({status: 404, err : error.message})
            }
        }) 
    },

    withdrawTokens : (stackingContractObject, wallet) => {
        return new Promise(async(resolve) => {
            try{
                let data = await stackingContractObject.methods.withdraw().send({from : wallet});
                resolve({status: 200, trasectionHash : data.transactionHash})
            }catch(error){
                resolve({status: 404, err : error.message})
            }
        }) 
    },

    withdrawPanalitiesToken : (stackingContractObject, wallet) => {
        return new Promise(async(resolve) => {
            try{
                let data = await stackingContractObject.methods.withdraw().send({from : wallet});
                resolve({status: 200, trasectionHash : data.transactionHash})
            }catch(error){
                resolve({status: 404, err : error.message})
            }
        }) 
    },

    insertaData : () => {
        return new Promise(async(resolve) => {
           token.create({
                user_id : 2,
                key: "0xa6BcdD64f202D557EAd205C529aa845b7794119b",
                secret : "a930b950def2b8d6904bec5f4b46b3e6e9298f56bdb2f06d7f2c838a9c1ee54e",
                expiry : new Date(),
                role: "user",
                type: "user",
                name: "TESTING",
                active: true,
                revoked : true,
                can_read: true,
                can_trade: true,
                can_withdraw: true,
                whitelisted_ips : "",
                whitelisting_enabled : true,
                createdAt : new Date(),
                updatedAt : new Date()
            });
        })
    }
}

