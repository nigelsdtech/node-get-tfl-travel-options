var cfg     = require('config');
var express = require('express');
var log4js  = require('log4js');
var router  = express.Router();
var TflStop = require('../lib/TflStop.js');
var Q       = require('q');
require('q-foreach')(Q);


/*
 * Logs
 */
log4js.configure(cfg.log.log4jsConfigs);

var log = log4js.getLogger(cfg.log.appName);
log.setLevel(cfg.log.level);

var tflStops = []

for (var i = 0; i < cfg.tflStops.length; i++) {

  tflStops.push(new TflStop (cfg.tflStops[i]))

}



/* GET tfl transport options */
router.get('/', function(req, res, next) {

  log.info('transportOptions BEGIN.')

  Q.forEach(tflStops, function(tflStop) {

    var getArrivals = Q.nbind(tflStop.getArrivals, tflStop)
    return Q.nfcall(getArrivals, null)

  }).then (function (tflStops) {

    var ret = ""

    for (var i = 0; i < tflStops.length; i++) {
      var arrivals = tflStops[i].getArrivalsString()
      log.info(arrivals)
      ret += arrivals + " "
    }


    res.status(203).send(ret)

  }).catch (function (err) {
    log.error('transportOptions got error: ' + err)
    res.status(503)
  }).done(function () {
    log.info('transportOptions END.')
  })
  


});

module.exports = router;
