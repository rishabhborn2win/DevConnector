const express = require("express");
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const User = require('../../models/Users');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');
const { post } = require("request");


//route     POST api/post  
//desc:     create a post
//access:   private
router.post("/", [
  auth,
  [
    check('text', 'text field is req').not().isEmpty()
  ]
],
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array() });
    }
     
    try {
       
      const user = await User.findById(req.user.id).select('-password');

    const newPost = {
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id
    }
     
    const post = new Post(newPost);

    await post.save();

    res.json(post);
     
    } catch (err) {
      console.error(err);
      res.status(500).send('server error');
    }

});

//route     GET api/post  
//desc:     get all post
//access:   private

router.get('/', auth, async (req, res) => {
  try {
    const post = await Post.find().sort({ date: -1});
    res.json(post);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('server error')
  }
});

//route     GET api/post/:post_id  
//desc:     get post by id
//access:   private

router.get('/:id', auth, async (req, res) => {
  try {
    
    const post = await Post.findById(req.params.id) ;
    if(!post){
      res.status(404).send('Post Not Found');
    }
    res.json(post);
  } catch (err) {
    console.log(err.message);
    if(err.kind == 'ObjectId'){
      res.status(404).send('Post Not Found');
    }
    res.status(500).send('server error')
  }
});

//route     DELETE api/post/:post_id  
//desc:     get post by id
//access:   private

router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id) ;

    if(!post){
      res.status(404).send('Post Not Found');
    }
    

    //check of user
    if(post.user.toString() !== req.user.id){
      return res.status(401).json({ msg: "Not Auth" });
    }

    await post.remove();

    res.json({msg: "Post Removed", })

  } catch (err) {
    console.log(err.message);
    if(err.kind == 'ObjectId'){
      res.status(404).send('Post Not Found');
    }
    res.status(500).send('server error')
  }
});

//route     UPDATE api/post/:post_id  
//desc:     update your post
//access:   private

router.post('/:id', [auth, check('text', 'text is req').not().isEmpty()], async (req, res) => {

  const user = await User.findById(req.user.id);

  const updatePost = {
    text: req.body.text,
    name: user.name,
    avatar: user.avatar,
    user: req.user.id
  }
  try {
    const post = await Post.findById(req.params.id);


    if(!post){
      res.status(404).send('Post Not Found');
    }
    //check of user
    if(post.user.toString() !== req.user.id){
      return res.status(401).json({ msg: "Not Auth" });
    }
    //if there is a post then it can use to update the post
    
      // update
      await Post.findOneAndUpdate({ user: req.user.id }, {$set :updatePost}, {new: true});
      return res.json({msg: "updated successfully"});


  } catch (err) {
    console.log(err.message);
    res.status(500).send('server error');
  }
});


//route     PUT api/post/like/:post_id  
//desc:     like a post
//access:   private


router.put('/like/:postid', auth, async (req, res) => {

    try {
      
      const post = await Post.findById(req.params.postid);

      // check if the post is liked by the user
      if(post.likes.filter(like => like.user.toString() === req.user.id).length>0) {
        return res.status(400).json({ msg : "Already Liked"});
      }

      post.likes.unshift({ user: req.user.id})

      await post.save();

      res.json(post.likes)

    } catch (err) {
      console.log(err.message);
      res.status(500).send('server error');
    }
})


//route     PUT api/post/unlike/:post_id  
//desc:     unlike a post
//access:   private


router.put('/unlike/:postid', auth, async (req, res) => {

  try {
    
    const post = await Post.findById(req.params.postid);

    // check if the post is liked by the user
    if(post.likes.filter(like => like.user.toString() === req.user.id).length==0) {
      return res.status(400).json({ msg : "post has not been liked yet"});
    }

    // remove index
    const removeIndex =  post.likes.map(like => like.user.toString()).indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);

    post.save();

    res.json(post.likes)

  } catch (err) {
    console.log(err.message);
    res.status(500).send('server error');
  }
});

//route     PUT api/post/comment/:post_id
//desc:     comment on a post
//access:   private
router.put("/comment/:postid", [
  auth,
  [
    check('text', 'text field is req').not().isEmpty()
  ]
],
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array() });
    }
     
    try {
       
      const user = await User.findById(req.user.id).select('-password');

    const newComment = {
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id
    }

    const post = await Post.findById(req.params.postid);
     
    post.comments.unshift(newComment);

    await post.save();

    res.json(post.comments);
     
    } catch (err) {
      console.error(err);
      res.status(500).send('server error');
    }

});


//route     DELETE api/post/comment/remove/:post_id
//desc:     remove a comment on a post
//access:   private
router.delete("/comment/:postid/:commentid", auth,  async (req, res) => {
     
    try {

    const post = await Post.findById(req.params.postid);

    const comment =  post.comments.find(comment => comment.id=== req.params.commentid);    
    
      //make sure comment exists
        if(!comment){
          return res.status(404).json({ msg: "Comment doesn't exist"})
        }
        

        if(comment.user.toString() !== req.user.id){
          return res.status(401).json({ msg: "Not Auth"})
        }

      const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);
      post.comments.splice(removeIndex, 1); 

      await post.save();

      res.json(post.comments);
     
    } catch (err) {
      console.error(err);
      res.status(500).send('server error');
    }

});
module.exports = router;
