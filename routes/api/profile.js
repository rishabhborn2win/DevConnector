const express = require("express");
const request = require("request");
const config = require("config");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/Users");
const Post = require("../../models/Post");
const { check, validationResult } = require("express-validator");

//route     GET api/PROFILE/my
//desc:     Get Current users profile
//access:   Private
router.get("/my", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(400).json({
        msg: "There is no profile for this user",
      });
    }

    res.json(profile);
  } catch (err) {
    console.log(err);
    res.status(500).send("server error");
  }
});

//route     POST api/PROFILE/
//desc:     Create or update
//access:   Private
router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is required").not().isEmpty(),
      check("skills", "Skills is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      twitter,
      instagram,
      facebook,
      linkedin,
    } = req.body;

    //  build profile object

    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }

    // build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        // update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }

      // create
      profile = new Profile(profileFields);

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.log(err);
      res.status(500).send("server error");
    }

    res.send("hello");
  }
);

//route     GET api/profile
//desc:     View all profiles that are registered
//access:   Public

router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server-error");
  }
});

//route     GET api/PROFILE/user/:user_id
//desc:     get profile by user id
//access:   Public

router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);
    if (!profile) {
      return res.status(400).json({ msg: "Profile Not Found" });
    }
    res.json(profile);
  } catch (err) {
    console.log(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile Not found" });
    }
    res.status(500).send("server-error");
  }
});

//route     DELETE api/PROFILE/
//desc:     delete profile , user & post
//access:   private

router.delete("/", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      res.json({ msg: "there is no profile" });
    }
    await Profile.deleteOne({ user: req.user.id });
    await User.findByIdAndRemove(req.user.id);
    await Post.deleteMany({ user: req.user.id });

    res.json({ msg: "user deleted" });
  } catch (err) {
    console.log(err.message);
  }
});

//route     PUT api/profile/experience
//desc:     Add experience
//access:   private

router.put(
  "/experience",
  [
    auth,
    check("title", "title is req").not().isEmpty(),
    check("company", "company is req").not().isEmpty(),
    check("from", "from data is req").not().isEmpty(),
  ],
  async (req, res) => {
    // checking the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    // defining fields

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.push(newExp);
      //Saving it into the database
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ msg: "server error" });
    }
  }
);

//route     DELETE api/profile/experience/:experience_id
//desc:     delete particular experience
//access:   private

router.delete("/experience/:expId", auth, async (req, res) => {
  try {
    const expId = req.params.expId;
    const profile = await Profile.findOne({ user: req.user.id });

    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(expId);
    profile.experience.splice(removeIndex, 1);
    //updating the result
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("server error");
  }
});

//route     PUT api/profile/education
//desc:     Add education
//access:   private

router.put(
  "/education",
  [
    auth,
    check("school", "title is req").not().isEmpty(),
    check("degree", "degree is req").not().isEmpty(),
    check("fieldofstudy", "field of study data is req").not().isEmpty(),
    check("from", "from data is req").not().isEmpty(),
    check("current", "current data is req").not().isEmpty(),
  ],
  async (req, res) => {
    // checking the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    // defining fields

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
      location,
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
      location,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.push(newEdu);
      //Saving it into the database
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ msg: "server error" });
    }
  }
);

//route     DELETE api/profile/education/:edu_id
//desc:     delete particular education
//access:   private

router.delete("/education/:eduId", auth, async (req, res) => {
  try {
    const eduId = req.params.eduId;
    const profile = await Profile.findOne({ user: req.user.id });

    const removeIndex = profile.education.map((item) => item.id).indexOf(eduId);
    profile.education.splice(removeIndex, 1);
    //updating the result
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("server error");
  }
});

//route     GET api/profile/github/:username
//desc:     view users repo in github
//access:   public

router.get("/github/:username", async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`,
      method: "GET",
      headers: { "user-agent": "node.js" },
    };

    request(options, (error, response, body) => {
      if (error) {
        console.error(error.message);
      }

      res.json(JSON.parse(body));
    });
  } catch (error) {}
});

module.exports = router;
