const MessenteApi = require('messente_api');
const sequelize = require('../databaseConnection/db');
require('dotenv').config()
const {Op} = require("sequelize")
const opt = require("../models/otp")
const token = require("../models/tokens")
const unstackingRequest = require("../models/unstackingRequest")
const StackingAbi = require("../abi/stackingAbi.json");
const gulfAbi = require("../abi/gulfAbi.json");

const {MESSENTEEUSERNAME, MESSENTEPASSWORD, SENDERNAME, EXPIRYMINUTES,GULFCONTRACTADDRESS,STACKINGCONTRACTADDRESS, PROVIDER, TOKENCONTRACTADDRESS} = process.env;

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

    getProvider : () => {
        return new Promise(async(resolve) => {

            const {JsonRpcProvider} = require("@ethersproject/providers");
            const provider = new JsonRpcProvider(PROVIDER);
            resolve(provider)
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

    getContractObjectSwapping : (web3) => {
        return new Promise ( resolve  => {
            let contract = new web3.eth.Contract( USDTABI, TOKENCONTRACTADDRESS );
            resolve(contract)
        })
    },

    getWalletPrivateKey : (userId) => {
        return new Promise(async(resolve) => {
            try{
                let data = await token.findOne({ 
                    where: {
                        user_id : userId,
                    },
                })
                resolve({wallet : data.toJSON().key, privateKey: data.toJSON().secret});
            }catch(error){
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
                resolve(0)
            }
        })
    },

    stackeToken : (wallet, amount, package, stackingContractObject) => {
        return new Promise(async(resolve) => {
            try{
                console.log(" Stacking ========>>>>>>>>>>>>>>", amount)
                let data = await stackingContractObject.methods.stackToken( amount.toString() , package ).send({from : wallet});
                resolve( {status: 200, transactionHash : data.transactionHash})
            }catch(error){
                resolve({status:404, err : error.message})
            }
        })
    },

    transferAllow : (wallet, amount, gulfContractObject, web3) => {
        return new Promise(async(resolve) => {
            console.log("allowlance ========>>>>>>>>>>>>>>", amount)
            try{
                let result = await gulfContractObject.methods.increaseAllowance(STACKINGCONTRACTADDRESS, web3.utils.toWei(amount.toString()) ).send({from : wallet})
                console.log("transfer allow Hash ====>>>>>", result.transactionHash);
                resolve(result.transactionHash);
            }catch(error){
                resolve(false);
            }
        })
    },

    decreaseAllowanceBalance : (wallet, amount, gulfContractObject, web3) => {
        return new Promise(async(resolve) => {
            try{
                console.log("========>>>>>>>>>>>>>>", amount)
                let result = await gulfContractObject.methods.decreaseAllowance(STACKINGCONTRACTADDRESS, web3.utils.toWei(amount.toString()) ).send({from : wallet})
                console.log("transfer allow Hash ====>>>>>", result.transactionHash);
                resolve({status:200, trasectionHash: result.transactionHash });
            }catch(error){
                resolve({status:404, message: error.message})
            }
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

    updateStackingStartTime : (stackingContractObject, wallet, newTime) => {
        return new Promise(async(resolve) => {
            try{
                let data = await stackingContractObject.methods.updateStartTime(newTime).send({from : wallet});
                resolve({status: 200, trasectionHash : data.transactionHash})
            }catch(error){
                resolve({status: 404, err : error.message})
            }
        })
    },

    withdrawAdminBalance : (stackingContractObject, wallet) => {
        return new Promise(async(resolve) => {
            try{
                let data = await stackingContractObject.methods.withdraw().send({from : wallet});
                resolve({status: 200, trasectionHash : data.transactionHash})
            }catch(error){
                resolve({status: 404, err : error.message})
            }
        }) 
    },

    saveUnstackingReqest : (userId, wallet) => {
        return new Promise(async(resolve) => {
            try {
                unstackingRequest.create({
                    user_id   :  userId,
                    key       :  wallet,
                    approved  :  false,
                    createdAt :  new Date(),
                    updatedAt :  new Date()
                })
                resolve(true);
            }catch(err) {
                resolve(false)
            }
        })
    },

    getMyTokenBalance: (gulfContractObject, wallet, web3) => {
        return new Promise(async(resolve) => {
            try{
                let data = await gulfContractObject.methods.balanceOf(wallet).call({from : wallet});
                resolve({status: 200, balance : web3.utils.fromWei(data, 'ether')})
            }catch(err){
                resolve({status: 404, err : err.message})
            }
        })
    },

    getPackageAndReward : (contractObjectStacking, wallet ) => {
        return new Promise(async(resolve) => {
            try{
                let data = await contractObjectStacking.methods.stackingUserDeatil(wallet).call({from : wallet});
                if(data){
                    let package = parseInt(data.stackingPlan);
                    var response = await contractObjectStacking.methods.rewardPercentage(package).call({from : wallet});
                }
                data.rewardPercentage = response;
                resolve({status: 200, data : data})
            }catch(error){
                resolve({status: 404, err : err.message}) 
            }
        })
    },

    totalStackedPenaltyAmount : (contractObjectStacking, wallet) => {
        return new Promise(async(resolve) => {
            try{
                let totalStackedAmount = await contractObjectStacking.methods.totalstackedAmount().call({from : wallet});
                let totalPenaltyAmount = await contractObjectStacking.methods.totalstackedAmount().call({from : wallet});
                let totalRewardsAmount = await contractObjectStacking.methods.totalRewardsDistributed().call({from : wallet});
                resolve({status: 200, totalStackedAmount: totalStackedAmount, totalPenaltyAmount : totalPenaltyAmount , totalRewardsAmount: totalRewardsAmount});
            }catch(error){
                resolve({status: 404, message: error.message })
            }
        })
    },

    getStackingStatus: (contractObjectStacking, wallet) => {
        return new Promise(async(resolve) => {
            try{
                let status = await contractObjectStacking.methods.stackingStatus().call({from : wallet});
                resolve({status: 200, stackingStatus : status });
            }catch(error){
                resolve({status: 404, message: error.message })
            }
        })
    },

    getAllPendingRequest : () => {
        return new Promise(async(resolve) => {
            try{
                let responseData = await unstackingRequest.findAll({raw:true})
                // unstackingRequest.findAll({
                //     include: {
                //       model: Users,
                //       as: 'Instruments',
                //       where: {
                //         userId: id
                //       }
                //     }
                // });
                let response = (responseData.length > 0) ? {status : 200, data : responseData } : {status : 200, data : {} } ;
                resolve(response)
            }catch(err){
                resolve({status: 404, message: err.message })
            }
        })
    },

    toggleStacking : (stackingContractObject, wallet, boolStatus) => {
        return new Promise(async(resolve) => {
            try{
                let data = await stackingContractObject.methods.stackingStatusUpdate(boolStatus).send({from : wallet});
                resolve({status: 200, trasectionHash : data.transactionHash })
            }catch(error){
                resolve({status: 404, message : error.message})
            }
        })
    }
}

