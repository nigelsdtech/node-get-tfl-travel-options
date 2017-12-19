/**
 * This interface class represents a transport stop (bus, tram, etc)
 */


var cfg     = require('config');
var log4js  = require('log4js');
var request = require('request');

/*
 * Logs
 */
log4js.configure(cfg.log.log4jsConfigs);

var log = log4js.getLogger(cfg.log.appName);
log.setLevel(cfg.log.level);




/**
 * Stop model constructor.
 * @param {object}   params               - Params to be passed in
 * @param {string}   params.name          - English name for the stop - primarily for display purposes
 * @param {string}   params.id            - Unique identifier for this stop on its respective system (e.g. TFL's system, National rail's system, etc)
 * @param {string}   params.vehicleType   - The type of vehicle (bus, tram, train, etc). Primarily for display purposes.
 * @param {number}   params.walkingTime   - Time it takes (in minutes) to walk to this stop.
 * @constructor
 */
function Stop (params) {

  this.name          = params.name
  this.id            = params.id
  this.vehicleType   = params.vehicleType
  this.walkingTime   = params.walkingTime



  // To be set by the getArrivals functions
  this.arrivals    = []

  this.log("info", "initialized.")
}


var method = Stop.prototype


/**
 * Stop.log
 *
 * @desc Writes a log
 *
 * @alias Stop.log
 *
 * @param  {string}   level - log level
 * @param  {callback} msg   - Log message
 */
method.log = function (level, msg) {
  log[level]("%s (%s) - %s", this.vehicleType, this.name, msg)
}



/**
 * Stop.getArrivals
 *
 * @desc Get the next x arrivals at this stop and their times
 *
 * @alias Stop.getArrivals
 *
 * @param  {object} params     - Parameters for request (currently unused)
 * @param  {callback} callback - The callback that handles the response. Returns callback(err, arrival[])
 *                               where arrivals are objects of the form {
 *                                 timeToArrival: a number representing the number of minutes (rounded down to the nearest minute) in which the vehicle will arrive
 *                               }
 */
method.getArrivals = function (params,cb) {

  var self = this

  self.arrivals = []

  self.loadArrivals(null,function (err, arrivingVehicles) {

    if (err) {
      self.log('error', 'Failed to load arrivals: ' + err)
      cb("Failed to load arrivals: " + err)
      return null
    }

    self.log('info', 'Got ' + arrivingVehicles.length + ' arrivals.')


    var maxResults = cfg.maxResultsPerOption || 3

    // Apply various filters to the returned arrivingVehicles
    var i = 0
    while (true) {

      // Only interested in up to (configurable number) results.
      if (i >= arrivingVehicles.length || i >= maxResults) {
        arrivingVehicles.splice(i, (arrivingVehicles.length - i) )
        break
      }

      var vehicle = arrivingVehicles[i]

      self.log('debug', '(' + i + ') Examining vehicle:')
      self.log('debug', JSON.stringify(vehicle,null,"\t"))

      // Filter out on custom criteria (if specified)
      if (!self.arrivalPassesCustomFilters({vehicle: vehicle})) {
        self.log('info', 'Filtering out vehicle.') 
        arrivingVehicles.splice(i,1)
        continue
      }

      // Filter out the result if it arrives earlier than the time it takes to walk to the station
      if (vehicle.timeToArrival - (self.walkingTime * 60) <= -0 ) {
        self.log('info', 'Filtering out vehicle "' + vehicle.vehicleId + '" arriving too early (' + vehicle.timeToArrival + ' seconds)')
        arrivingVehicles.splice(i,1)
        continue
      }

      i++
    }

    self.log('debug', 'Arrivals in order - ' + JSON.stringify(arrivingVehicles))
    self.arrivals = arrivingVehicles

    cb(null,self)

  })
}


/**
 * Stop.getArrivalsString
 *
 * @desc Get an English string describing the times of the arriving vehicles.
 *
 * @alias Stop.getArrivalsString
 *
 */
method.getArrivalsString = function () {

  var response = this.name + ": "

  if (this.arrivals.length == 0) {
    response += "No " + this.vehicleType + " coming."
    return response
  }

  response += this.vehicleType + " arriving in"

  for (var i = 0; i < this.arrivals.length; i++) {

    if (i > 0) {
      response += ","

      if (i == (this.arrivals.length - 1)) {
        response += " and"
      }
    }


    var timeToArrival = Math.floor(this.arrivals[i].timeToArrival/60)

    response += " " + timeToArrival

  }

  if (Math.floor(this.arrivals[this.arrivals.length-1].timeToArrival/60) == 1) { response += " minute." } else { response += " minutes." }

  return response

}


/**
 * Stop.loadArrivals
 *
 * @desc Load the list of arrivals from the data service. This needs to be overridden by the subclass based on the relevant service.
 *
 * @alias Stop.loadArrivals
 *
 * @param  {object} params     - Parameters for request (currently unused)
 * @param  {callback} callback - The callback that handles the response. Returns callback(err, arrival[])
 *                               where arrivals are objects of the form {
 *                                 timeToArrival: a number representing the number of minutes (rounded down to the nearest minute) in which the vehicle will arrive
 *                               }
 */
method.loadArrivals = function (params,cb) {

  this.log('error', 'loadArrivals needs to be overridden')
  cb('loadArrivals needs to be overridden')
}



/**
 * Stop.arrivalPassesCustomFilters
 *
 * @desc Apply a set of filters specific to the subclass to see if the vehicle is suitable.
 *
 * @alias Stop.arrivalPassesCustomFilters
 *
 * @param   {object}   params         - Parameters for request
 * @param   {object}   params.vehicle - Information about the arriving vehicle. The specifics of the vehicle can be changed per subclass
 * @returns {boolean}  true if the vehicle is deemed suitable (e.g. we can walk to it in time, it is on the right platform, etc)
 *
 */
method.arrivalPassesCustomFilters = function (params) {
  // Add your own custom filters in the subclass
  return true
}




module.exports = Stop
