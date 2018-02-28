var cfg       = require('config');
var express   = require('express');
var log4js    = require('log4js');
var router    = express.Router();
var TflStop   = require('../lib/TflStop.js');
var TrainStop = require('../lib/TrainStop.js');
var Q         = require('q');


/*
 * Logs
 */
log4js.configure(cfg.log.log4jsConfigs);

var log = log4js.getLogger(cfg.log.appName);
log.setLevel(cfg.log.level);


var stops = []

for (var i = 0; i < cfg.stops.length; i++) {

  var stop = cfg.stops[i]

  if (stop.infoService == "tfl") {
    stops.push(new TflStop(stop))
  } else if (stop.infoService == "train") {
    stops.push(new TrainStop(stop))
  }
}


/* GET all transport options */
router.get('/', function(req, res, next) {

  log.info('transportOptions BEGIN.')
  var startTime = new Date()

  var qJobs = []

  stops.forEach( function (stop, s) {
    var getArrivals = Q.nbind(stop.getArrivals, stop)
    qJobs.push(Q.nfcall(getArrivals, null))
  })

  Q.allSettled(qJobs)
  .then (function (stopPromises) {

    var ret = ""

    for (var i = 0; i < stops.length; i++) {
      var arrivals = stops[i].getArrivalsString()
      log.info(arrivals)
      ret += arrivals + "\n"
    }


    res.status(203).send(ret)

  }).catch (function (err) {
    log.error('transportOptions got error: ' + err)
    res.status(503)
  }).done(function () {
    var endTime = new Date()

    var serviceTime = ((endTime.getTime() - startTime.getTime()) / 1000)
    log.info('Request served in %ss.', serviceTime)
    log.info('transportOptions END.')
  })
  


});

module.exports = router;
