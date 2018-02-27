/**
 * This object represents a National Rail stop
 */


var cfg       = require('config');
var Darwin    = require('national-rail-darwin');
var parsetime = require('parsetime');
var Stop      = require('./Stop.js');



class TrainStop extends Stop {

  /**
   * TrainStop model constructor.
   * @param {object}   params               - Params to be passed in (mandatory)
   * @param {string}   params.name          - English name for the stop - primarily for display purposes (mandatory)
   * @param {string}   params.id            - National rail three letter code for the station. E.g. RMD for Richmond (mandatory)
   * @param {string}   params.destination   - National rail three letter code for the destination to search for. E.g. RMD for Richmond (mandatory)
   * @param {string}   params.vehicleType   - The type of vehicle (bus, tram, train, etc)
   * @param {number}   params.walkingTime   - Time it takes (in minutes) to walk to this stop.
   * @constructor
   */
  constructor(params) {
  
    super({
      name        : params.name,
      vehicleType : params.vehicleType || 'Train',
      walkingTime : params.walkingTime || 0
    })

    this.id          = params.id
    this.destination = params.destination

    this.darwin      = new Darwin(cfg.darwinKey)
  
  }
}



var method = TrainStop.prototype





/**
 * TrainStop.loadArrivals
 *
 * @desc Get the next x departures at this stop and their times
 *
 * @alias TrainStop.loadArrivals
 *
 * @param  {object}   params   - Parameters for request (currently unused)
 * @param  {callback} callback - The callback that handles the response. Returns callback(err, departures[])
 *                               where departures are objects of the form {
 *                                 timeToArrival: a number representing the number of seconds in which the vehicle will arrive
 *                               }
 */
method.loadArrivals = function (params,cb) {

  var self = this

  self.log('info', 'Getting arrival predictions from Darwin...')

  self.darwin.getDepartureBoardWithDetails(self.id, {
    rows: 15,
    destination: self.destination,
    timeOffset: self.walkingTime,
    timeWindow: 30
  }, function (err, departures) {

    if (err) {

      var errMsg = "Failed to contact Darwin: "

      if (typeof err === 'object') {
        self.log('error', 'Full Darwin error Darwin: ' + JSON.stringify(err))

        if (err.statusCode && err.body) {
          errMsg += "(" + err.statusCode + ") " + err.body
        } else if (err.code) {
          errMsg += err.code
        } else {
          errMsg += JSON.stringify(err)
        }

      } else {
        errMsg += err.code
      }


      cb(errMsg)
      return null
    }

    self.log('info', 'Got Darwin predictions - ' + JSON.stringify(departures))

    var departingVehicles = []
    // Extract the relevant information and send back in the format prescribed by the superclass

    // The time to arrival is either the estimated departure time or (if that reads "on time"),
    // the scheduled departure time
    for (var i = 0; i < departures.trainServices.length; i++) {
      var ts = departures.trainServices[i]

      var depTime = ts.std
      if (ts.etd != "On time") { depTime = ts.etd }

      try {
        var timeToArrival = self.getTimeToArrival({arrivalTime: depTime, currentTime: new Date()})
        departingVehicles.push({timeToArrival: timeToArrival, vehicleId: ts.rsid || ""})
      } catch(e) {
        self.log('error', 'Problem setting arrival time for vehicle ' + i + ': ' + e)
      }
    }

    cb(null,departingVehicles)
  })


}

/**
 * TrainStop.getTimeToArrival
 *
 * @desc Given the arrival time of a train as passed in by darwin (usually just HH:MM), it figures out the
 *       difference between the current time and that time.
 *
 * @alias TrainStop.getTimeToArrival
 *
 * @param  {object}   params              - Parameters for request
 * @param  {string}   params.arrivalTime  - A timestamp in "HH:MM" format
 * @returns {integer} numSeconds - The difference in seconds between the arrivalTime and the currentTime
 */
method.getTimeToArrival = function (params) {

  // Convert the darwin time to something sensible as it is currently just (HH:MM)
  var t = parsetime(params.arrivalTime)

  var timeToArrival = t['relative']

  // If for whatever reason the arrival time is in the past (this happens with Network Rail sometimes, just set it at 0.
  if (timeToArrival < 0) {
    timeToArrival = 0
  } else {
    // Convert from milliseconds to seconds
    timeToArrival = Math.floor(timeToArrival/1000)
  }

  return timeToArrival
}



module.exports = TrainStop
