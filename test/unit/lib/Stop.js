var cfg      = require('config');
var chai     = require('chai');
var Stop     = require('../../../lib/Stop.js');

/*
 * Set up chai
 */
chai.should();


// Common testing timeout
var timeout = 5*1000;

var basicStop = {
  name         : "Fiction Tram",
  vehicleType  : "Tram",
  walkingTime  : 0
}



describe('Stop.getArrivals', function () {

  var stop, b, mt

  var multipleTrams = [
    {timeToArrival: 733},
    {timeToArrival: 793},
    {timeToArrival: 1693}
  ]
  
  beforeEach (function () {
    b  = Object.assign({},basicStop)
    mt = multipleTrams.slice()
  })


  it('returns valid timeToArrivals for all known trams', function (done) {

    stop = new Stop(b)
    stop.loadArrivals = function (p, cb) { cb(null, mt) }

    stop.getArrivals(null, function (e,stop) {
      stop.arrivals.should.deep.equal([
        {timeToArrival: 733},
        {timeToArrival: 793},
        {timeToArrival: 1693}
      ])
      done();
    })
  });

  it('filters some arrivals on walking time', function (done) {

    b.walkingTime = 14
    stop = new Stop(b)
    stop.loadArrivals = function (p,cb) { cb(null, mt) }

    stop.getArrivals(null, function (e,stop) {
      stop.arrivals.should.deep.equal([
        {timeToArrival: 1693}
      ])
      done();
    })
  });

  it('filters all arrivals on walking time', function (done) {

    b.walkingTime = 30
    stop = new Stop(b)
    stop.loadArrivals = function (p,cb) { cb(null, mt) }

    stop.getArrivals(null, function (e,stop) {
      stop.arrivals.should.deep.equal([])
      done();
    })
  });


  it('applies a custom filter to some arrivals', function (done) {

    stop = new Stop(b)
    stop.loadArrivals = function (p,cb) { cb(null, mt) }
    stop.arrivalPassesCustomFilters = function (p) { if (p.vehicle.timeToArrival == 793) { return true } else { return false } }

    stop.getArrivals(null, function (e,stop) {
      stop.arrivals.should.deep.equal([
        {timeToArrival: 793}
      ])
      done();
    })
  });

  it('applies a custom filter to all arrivals', function (done) {

    stop = new Stop(b)
    stop.loadArrivals = function (p,cb) { cb(null, mt) }
    stop.arrivalPassesCustomFilters = function (p) { if (p.vehicle.timeToArrival > 1) { return false } else { return true } }

    stop.getArrivals(null, function (e,stop) {
      stop.arrivals.should.deep.equal([])
      done();
    })
  });

  it('returns no arrivals if the service had none none', function (done) {

    stop = new Stop(b)
    stop.loadArrivals = function (p,cb) { cb(null, []) }

    stop.getArrivals(null, function (e,stop) {
      stop.arrivals.should.deep.equal([])
      done();
    })
  });

  it('reports if service failed for any reason', function (done) {

    stop = new Stop(b)
    stop.loadArrivals = function (p,cb) { cb('Simulated failure') }

    stop.getArrivals(null, function (e,stop) {
      e.should.equal('Failed to load arrivals: Simulated failure')
      done();
    })
  });


  afterEach (function () {
    b = null
    stop = null
  })


})


describe('Stop.getArrivalsString', function () {

  var stop, b;
  var basicStopArrivalsString = "Fiction Tram: Tram arriving in %TRAM_ARRIVALS%."

  beforeEach(function () {
    b = Object.assign({},basicStop)
    stop = new Stop(b)
  })


  it('returns the expected string for many arrivals', function () {
     stop.arrivals = [{timeToArrival: 620},{timeToArrival: 1210},{timeToArrival: 1850}]
     stop.getArrivalsString(null).should.equal(basicStopArrivalsString.replace('%TRAM_ARRIVALS%', '10, 20, and 30 minutes'))
  });

  it('returns the expected string for many arrivals in a minute (singular)', function () {
     stop.arrivals = [{timeToArrival: 60},{timeToArrival: 70}]
     stop.getArrivalsString(null).should.equal(basicStopArrivalsString.replace('%TRAM_ARRIVALS%', '1, and 1 minute'))
  });

  it('returns the expected string for 1 arrival', function () {
     stop.arrivals = [{timeToArrival: 644}]
     stop.getArrivalsString(null).should.equal(basicStopArrivalsString.replace('%TRAM_ARRIVALS%', '10 minutes'))
  });

  it('returns the expected string for 1 arrival within a minute (singular)', function () {
     stop.arrivals = [{timeToArrival: 80}]
     stop.getArrivalsString(null).should.equal(basicStopArrivalsString.replace('%TRAM_ARRIVALS%', '1 minute'))
  });

  it('returns the expected string for no arrival', function () {
     stop.arrivals = []
     stop.getArrivalsString(null).should.equal(basicStopArrivalsString.replace('Tram arriving in %TRAM_ARRIVALS%', 'No Tram coming'))
  });

  afterEach(function () {
    stop = null
    b = null
  })
});


describe('Stop.loadArrivals', function () {

  it('returns an error by default (users are forced to write an override)', function (done) {
     var stop = new Stop(basicStop)
     stop.loadArrivals(null, function (err, ret) {
       err.should.equal('loadArrivals needs to be overridden')
       done()
     })
  })

})



describe('Stop.arrivalPassesCustomFilters', function () {

  it('returns true by default (users are forced to write an override)', function () {
     var stop = new Stop(basicStop)
     stop.arrivalPassesCustomFilters(null).should.equal(true)
  })

})
