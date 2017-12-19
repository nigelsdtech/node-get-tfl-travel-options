/**
 * This object represents a TFL stop (bus, tram, etc)
 */


var cfg     = require('config');
var request = require('request');
var Stop    = require('./Stop.js');



/**
 * Basic request params for all calls to TFL
 */
var tflRequestDefaults = {
  baseUrl : "https://api.tfl.gov.uk",
  json :     true
}

if (cfg.has('connectionTimeout')) { tflRequestDefaults.timeout = cfg.connectionTimeout }
var tflRequest = request.defaults(tflRequestDefaults)


class TflStop extends Stop {

  /**
   * TflStop model constructor.
   * @param {object}   params               - Params to be passed in
   * @param {string}   params.name          - English name for the stop - primarily for display purposes
   * @param {string}   params.naptanId      - TFL's unique identifier for a stop
   * @param {string[]} params.platformNames - For stations with multiple platforms, specify the ones in which we're interested. (Optional)
   * @param {string}   params.vehicleType   - The type of vehicle (bus, tram, train, etc)
   * @param {number}   params.walkingTime   - Time it takes (in minutes) to walk to this stop.
   * @constructor
   */
  constructor(params) {
  
    super({
      name        : params.name,
      vehicleType : params.vehicleType,
      walkingTime : params.walkingTime
    })

    this.naptanId      = params.naptanId
    this.platformNames = params.platformNames || null;
  
  }


}
  
var method = TflStop.prototype


/**
 * TflStop.loadArrivals
 *
 * @desc Get the next x arrivals at this stop and their times
 *
 * @alias TflStop.loadArrivals
 *
 * @param  {object} params     - Parameters for request (currently unused)
 * @param  {callback} callback - The callback that handles the response. Returns callback(err, arrival[])
 *                               where arrivals are objects of the form {
 *                                 timeToArrival: a number representing the number of minutes (rounded down to the nearest minute) in which the vehicle will arrive
 *                               }
 */
method.loadArrivals = function (params,cb) {

  var self = this

  self.log('info', 'Getting arrival predictions from TFL...')

  tflRequest.get({
    uri: "StopPoint/" + this.naptanId + "/Arrivals"
  }, function (err, resp, tflArrivals) {

    if (err) {
      cb("Failed to contact TFL: " + err)
      return null
    }

    if (resp.statusCode != 200) {
      var errMsg = 'Bad response from TFL: (' + resp.statusCode + ') ' 
      if (typeof resp.body === 'object') { errMsg += JSON.stringify(resp.body) } else { errMsg += resp.body }
      cb(errMsg)
      return null
    }

    self.log('info', 'Got TFL predictions - ' + JSON.stringify(tflArrivals))


    var arrivingVehicles = []
    // Extract the relevant information and send back in the format prescribed by the superclass
    for (var i = 0; i < tflArrivals.length; i++) {
      arrivingVehicles.push({
        vehicleId: tflArrivals[i].vehicleId,
        timeToArrival: tflArrivals[i].timeToStation
      })
    }

    // Annoyingly, TFL doesn't sort the reponses, so do it yourself.
    arrivingVehicles = arrivingVehicles.sort(function(a, b) {
      return parseFloat(a.timeToArrival) - parseFloat(b.timeToArrival);
    });
    
    cb(null,arrivingVehicles)
  })
}







module.exports = TflStop
