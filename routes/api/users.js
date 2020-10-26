const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs')
const { check, validationResult  } = require("express-validator");
    
const User = require('../../models/Users')

//route     POST api/USERS
//desc:     Registe User
//access:   public     
router.post('/', [
    check('name', 'Name is required')
    .not()
    .isEmpty(),
    check('email', 'please include a valid email')
    .isEmail(),
    check('password','Please enter a tough password of more then 6 Char')
    .isLength({ min: 6})
],
 async(req, res) => {
     const errors = validationResult(req);
     if(!errors.isEmpty()){
         return res.status(400).json({ errors: errors.array() });
     }

     const {name, email, password} = req.body;

     try{

     //See existing user

     let user  = await User.findOne({ email: email});

     if(user){
         return res.status(400).json({  errors: [ { msg: 'user already exists'}] });
     }

     //get users Gravatar

     const avatar = gravatar.url(email, {
         s:'200',
         r: 'pg',
         d: 'mm'
     })
     
      user = new User ({
         name,
         email,
         avatar,
         password
     })

     //Encrypt the pwd using bcrypt


     const salt = await bcrypt.genSalt(10);

     user.password = await bcrypt.hash(password, salt);

     await user.save()

     //Return JWT
    
     res.send('Registered')
     }catch(err){
        if(err){
            console.log(err.message);
            res.status(500).send('Server Error');
        }

     }

})

module.exports = router;