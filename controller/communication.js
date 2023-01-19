var express = require('express');
var router = express.Router();
const helper = require("../helper/customHelper")
router.post('/sendOTP', async(req, res, next) => {
  try{
    let {phoneNumber, userId} = req.body;
    let code = await helper.generateOPT();
    helper.saveOTP(code, userId);
    let response = await helper.sendMessage(phoneNumber, code);
    res.status(response.status).send(response);
  }catch(error){
    res.status(404).send(error)
  }
});

router.post("/codeVarify" , async(req,res) => {
  try{
    let {code , user_id} = req.body;
    let varificationStatus =  await helper.codeVarification(code, user_id)
    res.status(varificationStatus.status).send(varificationStatus);
  }catch(error){
    res.status(404).send(error)
  }
})

module.exports = router;