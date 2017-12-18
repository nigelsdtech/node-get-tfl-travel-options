var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send("Call /transportOptions to gather tfl options");
});

module.exports = router;
