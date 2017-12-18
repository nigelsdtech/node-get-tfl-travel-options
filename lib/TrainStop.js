/**
 * This object represents a National Rail stop
 */


var cfg     = require('config');
var Darwin  = require('national-rail-darwin');
var Stop    = require('./lib/Stop.js')



class TrainStop extends Stop {

  /**
   * TflStop model constructor.
   * @param {object}   params               - Params to be passed in
   * @param {string}   params.name          - English name for the stop - primarily for display purposes
   * @param {string}   params.id            - National rail three letter code for the station. E.g. RMD for Richmond
   * @param {string}   params.destination   - National rail three letter code for the destination to search for. E.g. RMD for Richmond
   * @param {string}   params.darwinAPIKey  - API key for using the Darwin service (you should have registered for one)
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

    this.id          = params.id
    this.destination = params.destination

    this.darwin      = new Darwin(cfg.darwinKey)
  
  }
}



var method = TrainStop.prototype





/**
 * TrainStop.loadArrivals
 *
 * @desc Get the next x arrivals at this stop and their times
 *
 * @alias TrainStop.loadArrivals
 *
 * @param  {object} params     - Parameters for request (currently unused)
 * @param  {callback} callback - The callback that handles the response. Returns callback(err, arrival[])
 *                               where arrivals are objects of the form {
 *                                 timeToArrival: a number representing the number of minutes (rounded down to the nearest minute) in which the vehicle will arrive
 *                               }
 */
method.loadArrivals = function (params,cb) {

  var self = this

  self.log('info', 'Getting arrival predictions from Darwin...')

  darwin.getDepartureBoardWithDetails(this.id, {
    rows: 15,
    destination: this.destination
  }, function (err, darwinArrivals) {

    if (err) {
      cb("Failed to contact Darwin: " + err)
      return null
    }

    self.log('info', 'Got Darwin predictions - ' + JSON.stringify(darwinArrivals))
  })

    var arrivingVehicles = []
    // Extract the relevant information and send back in the format prescribed by the superclass
    for (var i = 0; i < tflArrivals.length; i++) {
      arrivingVehicles.push({timeToArrival: tflArrivals[i].timeToStation})
    }

    // Annoyingly, TFL doesn't sort the reponses, so do it yourself.
    arrivingVehicles = arrivingVehicles.sort(function(a, b) {
      return parseFloat(a.timeToArrival) - parseFloat(b.timeToArrival);
    });
    
    cb(null,arrivingVehicles)
  })


}





module.exports = TrainStop
