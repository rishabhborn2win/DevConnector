const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult  } = require("express-validator");


const User = require('../../models/Users');
//route     GET api/AUTH
//desc:     Test Route
//access:   public     
router.get('/',auth, async (req, res) => {
    try{
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    }catch(err){
        console.log(err.message);
        res.status(500).send("server error")
    }
})



//route     POST api/auth
//desc:     authenticate User & get token
//access:   public     
router.post('/', [
    check('email', 'please include a valid email')
    .isEmail(),
    check('password','Please enter the password')
    .isLength({ min: 6})
],
 async(req, res) => {
     const errors = validationResult(req);
     if(!errors.isEmpty()){
         return res.status(400).json({ errors: errors.array() });
     }

     const { email, password} = req.body;

     try{ 

     //See existing user

     let user  = await User.findOne({ email: email});

     if(!user){
         return res.status(400).json({  errors: [ { msg: 'Not registered'}] });
     }
     
     const isMatch = await bcrypt.compare(password, user.password);

     if(!isMatch) return res.status(400).json({  errors: [ { msg: 'Password is wrong'}] });
     //Return JWT

     const payload ={
         user: {
            id: user.id
         }
     }

     jwt.sign(
         payload,
         config.get('JWTsecret'),
         { expiresIn: 360000},
         (err, token) => {
            if(err) console.log(err);
            res.json({ token });
         });
     }catch(err){
        if(err){
            console.log(err.message);
            res.status(500).send('Server Error');
        }
    }
});

module.exports = router;