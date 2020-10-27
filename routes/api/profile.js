const express = require("express");
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/Users');
const { check, validationResult } =  require('express-validator');


//route     GET api/PROFILE/my
//desc:     Get Current users profile
//access:   Private
router.get("/my", auth, async (req, res) => {
  try {
    
    const profile = await  Profile.findOne({ user: req.user.id}).populate('user', 
    ['name', 'avatar']);

    if(!profile){
      return res.status(400).json({
        msg: 'There is no profile for this user'
      });
    }
    
    res.json(profile);

  } catch (err) {
    console.log(err);
    res.status(500).send('server error');
  }
});


//route     POST api/PROFILE/
//desc:     Create or update
//access:   Private
router.post("/",
[
   auth,
   [
  check('status', 'Status is required')
  .not().
  isEmpty() ,
   check('skills', 'Skills is required').not().isEmpty()
   ]
 ],
  async (req, res) => {
   const errors = validationResult(req);
   if(!errors.isEmpty()) {
   return res.status(400).json({ errors: errors.array() });
   }

   const {
     company,
     website, location, bio, status, githubusername, skills, youtube, twitter, instagram, facebook, linkedin
   } = req.body;

  //  build profile object

  const profileFields = {};
  profileFields.user = req.user.id;
  if(company) profileFields.company = company;
  if(website) profileFields.website = website;
  if(location) profileFields.location = location;
  if(bio) profileFields.bio = bio;
  if(status) profileFields.status = status;
  if(githubusername) profileFields.githubusername = githubusername;
  if(skills) {
    profileFields.skills = skills.split(',').map(skill => skill.trim());
  }


    // build social object
    profileFields.social ={};
    if(youtube) profileFields.social.youtube = youtube;
    if(twitter) profileFields.social.twitter = twitter;
    if(facebook) profileFields.social.facebook = facebook;
    if(instagram) profileFields.social.instagram = instagram;
    if(linkedin) profileFields.social.linkedin = linkedin;
    
  try {

    let profile =  await Profile.findOne({ user: req.user.id });

    if(profile){
      // update
      profile = await Profile.findOneAndUpdate({ user: req.user.id }, {$set :profileFields}, {new: true});
      return res.json(profile);
    }

    // create
    profile = new Profile(profileFields);

    await profile.save();
    res.json(profile)
    
  } catch (err) {
    console.log(err);
    res.status(500).send("server error");
  }

  res.send('hello');

});

  


module.exports = router;
