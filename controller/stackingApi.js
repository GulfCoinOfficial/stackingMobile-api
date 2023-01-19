var express = require('express');
var router = express.Router();
const helper = require("../helper/customHelper")
require('dotenv').config()
const {STACKINGFEE} = process.env;
console.log("STACKING FEE testing ======>", process.env.STACKINGFEE);
console.log("ENV testing ======>", process.env.STACKINGFEE);
console.log("env testing ======>", process.env.SENDERNAME);
console.log("env testing ======>", process.env.EXPIRYMINUTES);
console.log("env testing ======>", process.env.STACKINGCONTRACTADDRESS);
//const STACKINGFEE = 10;
router.post('/stack', async(req, res) => {
    try{
        let {amount, package, userId} = req.body
        let UserWallet = await helper.getWalletPrivateKey(userId);
        if(UserWallet == false){
            res.status(404).send({status: 404, message : "Record not found!"})
            return;
        }
        let web3 = await helper.getWeb3Object(UserWallet.privateKey);
        let gulfContractObject = await helper.getContractObjectGulf(web3);
        let stackingContractObject = await helper.getContractObjectStacking(web3);
    
        let balance = await helper.checkBalance(UserWallet.wallet, gulfContractObject, web3);
        console.log("balance ======>>>>", balance) ;
        console.log("stacking amount", amount+ parseInt(STACKINGFEE)) ;
        if(balance >= (amount + parseInt(STACKINGFEE)) ){
            let transferAllownce = await helper.transferAllow(UserWallet.wallet, (amount + parseInt(STACKINGFEE)), gulfContractObject, web3) ;            
            if(transferAllownce == false){
                res.status(404).send({status: 404, message : "Insufficient Allowance decrease the allowance first and try again!"})
                return;
            }            
            let responseData = await helper.stackeToken(UserWallet.wallet , (amount + parseFloat(STACKINGFEE)), package.toString(), stackingContractObject, web3)
            if(responseData.status == 404){
                helper.decreaseAllowanceBalance(UserWallet.wallet, (amount + parseInt(STACKINGFEE)), gulfContractObject, web3); 
            }
            responseData.transferAllowHash = transferAllownce;
            console.log("test",responseData)
            res.status(responseData.status).send(responseData)
        }else{
            res.status(404).send({status: 404, message : "Insufficient balance or something wrong!"})
        }
    }catch(error){
        res.status(404).send(error.message)
    }
})
router.post('/unstack', async(req,res,next) => {
    try{
        let userId = req.body.userId ;
        let UserWallet = await helper.getWalletPrivateKey(userId) ;
        if(UserWallet == false){
            res.status(404).send({message : "Record not found!"});
            return;
        }
        let web3 = await helper.getWeb3Object(UserWallet.privateKey);
        let stackingContractObject = await helper.getContractObjectStacking(web3);
        let response = await helper.sendUnstackRequest(stackingContractObject, UserWallet.wallet);
        if(response.status == 200){
            let responseData = await helper.saveUnstackingReqest(userId, UserWallet.wallet)
            if(responseData == false){
                res.status(404).send({ status : 404, message : "Database have some issue try again!"})
                return true;
            }
        }
        res.status(response.status).send(response)
    }catch(error){
        res.status(404).send(error)
    }
})

router.post('/claimRewards', async(req,res,next) => {
    try{
        let userId = req.body.userId ;
        let UserWallet = await helper.getWalletPrivateKey(userId) ;
        if(UserWallet == false){
            res.status(404).send({message : "Record not found!"});
            return;
        }
        let web3 = await helper.getWeb3Object(UserWallet.privateKey);
        let stackingContractObject = await helper.getContractObjectStacking(web3);
        let response = await helper.sendRequestForClaims(stackingContractObject, UserWallet.wallet);
        res.status(response.status).send(response)
    }catch(error){
        res.status(404).send(error)
    }
})

router.post("/renewPackage", async(req,res) => {
    try{
        let {userId, newPackage }= req.body ;
        let UserWallet = await helper.getWalletPrivateKey(userId) ;
        if(UserWallet == false){
            res.status(404).send({message : "Record not found!"});
            return;
        }
        let web3 = await helper.getWeb3Object(UserWallet.privateKey);
        let stackingContractObject = await helper.getContractObjectStacking(web3);
        let response = await helper.renewPackages(stackingContractObject, UserWallet.wallet, newPackage);
        res.status(response.status).send(response)
    }catch(error){
        res.status(404).send(error)
    }
})

router.post("/approvedUnstackRequest", async(req,res) => {
    try{
        let {userId, adminId }= req.body ;
        let UserWallet = await helper.getWalletPrivateKey(userId) ;
        if(UserWallet == false){
            res.status(404).send({message : "Record not found!"});
            return;
        }
        let adminWallets = await helper.getWalletPrivateKey(adminId) ;
        if(adminWallets == false){
            res.status(404).send({message : "Record not found!"});
            return;
        }
        let web3 = await helper.getWeb3Object(adminWallets.privateKey);
        let stackingContractObject = await helper.getContractObjectStacking(web3);
        let response = await helper.approvedRequest(stackingContractObject, UserWallet.wallet, adminWallets.wallet);
        res.status(response.status).send(response)
    }catch(error){
        res.status(404).send(error)
    } 
})

router.post("/updatePackageBreakingPanalities", async(req,res) => {
    try{
        let {adminId, package, newPercentage }= req.body ;
        let adminWallets = await helper.getWalletPrivateKey(adminId) ;
        if(adminWallets == false){
            res.status(404).send({message : "Record not found!"});
            return;
        }
        let web3 = await helper.getWeb3Object(adminWallets.privateKey);
        let stackingContractObject = await helper.getContractObjectStacking(web3);
        let response = await helper.updatePanality(stackingContractObject, adminWallets.wallet, package, newPercentage);
        res.status(response.status).send(response)
    }catch(error){
        res.status(404).send(error)
    } 
})

router.post("/updateRewardsPercentage", async(req,res) => {
    try{
        let {adminId, package, newPercentage }= req.body ;
        let adminWallets = await helper.getWalletPrivateKey(adminId) ;
        if(adminWallets == false){
            res.status(404).send({message : "Record not found!"});
            return;
        }
        let web3 = await helper.getWeb3Object(adminWallets.privateKey);
        let stackingContractObject = await helper.getContractObjectStacking(web3);
        let response = await helper.updateRewards(stackingContractObject, adminWallets.wallet, package, newPercentage);
        res.status(response.status).send(response)
    }catch(error){
        res.status(404).send(error)
    } 
})

router.post("/updateStackingFee", async(req,res) => {
    try{
        let {adminId, newPrice}= req.body ;
        let adminWallets = await helper.getWalletPrivateKey(adminId) ;
        if(adminWallets == false){
            res.status(404).send({message : "Record not found!"});
            return;
        }
        let web3 = await helper.getWeb3Object(adminWallets.privateKey);
        let stackingContractObject = await helper.getContractObjectStacking(web3);
        let response = await helper.updateStackingPrice(stackingContractObject, adminWallets.wallet, newPrice);
        res.status(response.status).send(response)
    }catch(error){
        res.status(404).send(error)
    } 
})

router.post("/withdraw" , async(req, res) => {
    try{
        const  userId  = req.body.adminId;
        let adminWallet = await helper.getWalletPrivateKey(userId);
        if(adminWallet == false){
            res.status(404).send({status: 404, message : "Record not found!"})
            return;
        }
        let web3 = await helper.getWeb3Object(adminWallet.privateKey);
        let stackingContractObject = await helper.getContractObjectStacking(web3);
        let response = await helper.withdrawAdminBalance(stackingContractObject, adminWallet.wallet);
        res.status(response.status).send(response)
    }catch(error){
        res.status(404).send(error.message);
    }
})

router.post("/getUserWallet", async(req, res) => {
    try{
        let userId = req.body.userId;
        let UserWallet = await helper.getWalletPrivateKey(userId);
        if(UserWallet == false){
            res.status(404).send({status: 404, message : "Record not found!"})
            return;
        }
        res.status(200).send({status: 200, wallet : UserWallet.wallet})
    }catch(error){
        res.status(404).send(error.message)  
    }
})

router.get("/unstackedRequest", async(req,res) => {
    try{
        let data = await helper.getAllPendingRequest();
        res.status(data.status).send(data)
    }catch(error){
        res.status(404).send(error.message) 
    }
})

router.post("/myBalance", async(req, res) => {
    try{
        let userId = req.body.userId;
        let UserWallet = await helper.getWalletPrivateKey(userId);
        if(UserWallet == false){
            res.status(404).send({status: 404, message : "Record not found!"})
            return;
        }
        let web3 = await helper.getWeb3Object(UserWallet.privateKey);
        let gulfContractObject = await helper.getContractObjectGulf(web3);
        let response = await helper.getMyTokenBalance(gulfContractObject, UserWallet.wallet, web3);
        res.status(response.status).send(response)
    }catch(error){
        res.status(404).send(error.message)  
    }
})

router.post("/myPackageAndRewardsPercentage", async(req, res) => {
    try{
        let userId = req.body.userId;
        let UserWallet = await helper.getWalletPrivateKey(userId);
        if(UserWallet == false){
            res.status(404).send({status: 404, message : "Record not found!"})
            return;
        }
        let web3 = await helper.getWeb3Object(UserWallet.privateKey);
        let contractObjectStacking = await helper.getContractObjectStacking(web3);
        let response = await helper.getPackageAndReward(contractObjectStacking, UserWallet.wallet);
        res.status(response.status).send(response)
    }catch(error){
        res.status(404).send(error.message)   
    }
})

router.post("/stackingToggle", async(req, res) => {
    try{
        const  userId  = req.body.userId;
        let boolStatus = req.body.status;
        let UserWallet = await helper.getWalletPrivateKey(userId);
        if(UserWallet == false) {
            res.status(404).send({status: 404, message : "Record not found!"})
            return;
        }
        let web3 = await helper.getWeb3Object(UserWallet.privateKey);
        let stackingContractObject = await helper.getContractObjectStacking(web3);
        let response = await helper.toggleStacking(stackingContractObject, UserWallet.wallet, boolStatus);
        res.status(response.status).send(response)
    }catch(error){
        res.status(404).send(error.message)
    }
})

router.post("/getTotalStackedAndPenaltyAmount", async(req, res) => {
    try{
        let adminId = req.body.adminId;
        let adminWallet = await helper.getWalletPrivateKey(adminId);
        if(adminWallet == false){
            res.status(404).send({status: 404, message : "Record not found!"})
            return;
        }
        let web3 = await helper.getWeb3Object(adminWallet.privateKey);
        let contractObjectStacking = await helper.getContractObjectStacking(web3);
        let response = await helper.totalStackedPenaltyAmount(contractObjectStacking, adminWallet.wallet);
        console,log("Response =====>>", response);
        res.status(response.status).send(response)
    }catch(error){
        res.status(404).send(error.message)
    }
})

router.post("/getStackingStatus", async(req,res) => {
    try{
        let adminId = req.body.adminId;
        let adminWallet = await helper.getWalletPrivateKey(adminId);
        if(adminWallet == false){
            res.status(404).send({status: 404, message : "Record not found!"})
            return;
        }
        let web3 = await helper.getWeb3Object(adminWallet.privateKey);
        let contractObjectStacking = await helper.getContractObjectStacking(web3);
        let response = await helper.getStackingStatus(contractObjectStacking, adminWallet.wallet);
        res.status(response.status).send(response)
    }catch(error){
        res.status(404).send(error.message)
    }
})

//testing purpose
router.post("/forceDecreaseAllowlance", async(req,res) => {
    try{
        let {amount, userId} = req.body
        let UserWallet = await helper.getWalletPrivateKey(userId);
        if(UserWallet == false){
            res.status(404).send({status: 404, message : "Record not found!"})
            return;
        }
        let web3 = await helper.getWeb3Object(UserWallet.privateKey);
        let gulfContractObject = await helper.getContractObjectGulf(web3);
        let response  = await helper.decreaseAllowanceBalance(UserWallet.wallet , (amount + parseInt(STACKINGFEE)), gulfContractObject, web3); 
        res.status(response.status).send(response)
    }catch(error){
        res.status(404).send(error.message)
    }
})

router.post('/updateStartTime', async(req,res) => {
    try{
        const { userId, newTime} = req.body;
        let UserWallet = await helper.getWalletPrivateKey(userId);
        if(UserWallet == false){
            res.status(404).send({status: 404, message : "Record not found!"})
            return;
        }
        let web3 = await helper.getWeb3Object(UserWallet.privateKey);
        let stackingContractObject = await helper.getContractObjectStacking(web3);
        let response = await helper.updateStackingStartTime(stackingContractObject, UserWallet.wallet, newTime);
        res.status(response.status).send(response)
    }catch(error){
        res.status(404).send(error.message)
    }
})


module.exports = router;