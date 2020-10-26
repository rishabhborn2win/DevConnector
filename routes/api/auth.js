const express = require('express');
const router = express.Router();

//route     GET api/AUTH
//desc:     Test Route
//access:   public     
router.get('/', (req, res) => {
    res.send('AUTH route');
})

module.exports = router;