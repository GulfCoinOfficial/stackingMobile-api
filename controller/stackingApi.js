var express = require('express');
var router = express.Router();
const helper = require("../helper/customHelper")
require('dotenv').config()
//const {STACKINGFEE} = process.env;
const STACKINGFEE = 10;
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
        let transferAllownce = await helper.transferAllow(UserWallet.wallet, (amount + parseInt(STACKINGFEE)), gulfContractObject, web3) ;
        if(balance >= (amount + parseInt(STACKINGFEE)) && transferAllownce != false){
            let responseData = await helper.stackeToken(UserWallet.wallet , (amount + parseInt(STACKINGFEE)), package.toString(), stackingContractObject, web3)
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
        let userId = req.body ;
        let UserWallet = await helper.getWalletPrivateKey(userId) ;
        if(UserWallet == false){
            res.status(404).send({message : "Record not found!"});
            return;
        }
        let web3 = await helper.getWeb3Object(UserWallet.privateKey);
        let stackingContractObject = await helper.getContractObjectStacking(web3);
        let response = await helper.sendUnstackRequest(stackingContractObject, UserWallet.wallet);
        res.status(response.status).send(response)
    }catch(error){
        res.status(404).send(error)
    }
})

router.post('/claimRewards', async(req,res,next) => {
    try{
        let userId = req.body ;
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
        if(UserWallet == false){
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
        if(UserWallet == false){
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
        if(UserWallet == false){
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

router.post("/updateStackingFee", async(req,res) => {
    try{
        let {adminId, newPrice}= req.body ;
        let adminWallets = await helper.getWalletPrivateKey(adminId) ;
        if(UserWallet == false){
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

router.get("/saveData", async(req,res) => {
    helper.insertaData();
    res.status(200).send({message: "Success"})
})

module.exports = router;