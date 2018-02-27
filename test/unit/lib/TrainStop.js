var cfg        = require('config');
var chai       = require('chai');
var dateformat = require('dateformat');
var fs         = require('fs');
var nock       = require('nock');
var parsetime  = require('parsetime');
var TrainStop  = require('../../../lib/TrainStop.js');
                
/*              
 * Set up chai
 */
chai.should();


// Common testing timeout
var timeout = 5*1000;

var darwinHost = "https://lite.realtime.nationalrail.co.uk/OpenLDBWS/ldb9.asmx"
var darwinUri = ""

var basicStop = {
  name         : "Fiction Train",
  id           : "ABC",
  destination  : "DEF",
  walkingTime  : 0
}

/*
 * The actual tests
 */

describe('TrainStop.getTimeToArrival', function () {

  var trainStop

  beforeEach (function () {
    var b = Object.assign({},basicStop)
    trainStop = new TrainStop(b)
  })

  it('returns the correct difference when the arrivalTime > currentTime', function () {
    var at       = new Date(parsetime('in 10 minutes').absolute)
    var atDarwin = dateformat(at, 'HH:MM')

    var t = trainStop.getTimeToArrival({arrivalTime: atDarwin})

    // Round up to the nearest minute
    Math.ceil(t/60).should.equal(10)
  })

  it('returns 0 when the arrivalTime < currentTime', function () {
    var at       = new Date(parsetime('10 minutes ago').absolute)
    var atDarwin = dateformat(at, 'HH:MM')

    var t = trainStop.getTimeToArrival({arrivalTime: atDarwin})

    // Round up to the nearest minute
    Math.ceil(t/60).should.equal(0)
  })

})

describe('TrainStop.loadArrivals', function () {

  this.timeout(timeout);

  var trainStop, b, nockRet
  var td = fs.readFileSync('./test/data/multipleTrains.xml')

  beforeEach (function () {

    nockRet = nock(darwinHost, {
      reqheaders: {
        'content-type': 'text/xml'
      }
    })
    .persist()
    .post('', /.*/)

    b = Object.assign({},basicStop)
    trainStop = new TrainStop(b)
  })

  it('returns valid timeToArrivals for all returned trains in ascending order of arrival', function (done) {

    var bd = td

    // Sanitize the data in the samples file
    var intervals = [5, 10, 15, 20, 25, 30]
    intervals.forEach(function(i) {
      var d = parsetime('in ' + i + ' minutes')
      d = new Date(d['absolute'])
      bd = bd.toString().replace('$$IN_' + i + '_MINUTES$$', dateformat(d, 'HH:MM'))
    })

    nockRet.reply(200,bd)

    trainStop.loadArrivals(null, function (e,arrivals) {

      Math.ceil(arrivals[0].timeToArrival/60).should.equal(5)
      Math.ceil(arrivals[1].timeToArrival/60).should.equal(10)
      Math.ceil(arrivals[2].timeToArrival/60).should.equal(15)
      Math.ceil(arrivals[3].timeToArrival/60).should.equal(20)
      Math.ceil(arrivals[4].timeToArrival/60).should.equal(25)
      Math.ceil(arrivals[5].timeToArrival/60).should.equal(30)
      done();
    })
  });

  it('skips over an entry with an invalid arrival time', function (done) {

    var bd = td

    // Sanitize the data in the samples file
    var intervals = [5, 10, 20, 25, 30]
    intervals.forEach(function(i) {
      var d = parsetime('in ' + i + ' minutes')
      d = new Date(d['absolute'])
      bd = bd.toString().replace('$$IN_' + i + '_MINUTES$$', dateformat(d, 'HH:MM'))
    })

    //bd = bd.toString().replace('$$IN_15_MINUTES$$', 'invalid time')

    nockRet.reply(200,bd)

    trainStop.loadArrivals(null, function (e,arrivals) {

      Math.ceil(arrivals[0].timeToArrival/60).should.equal(5)
      Math.ceil(arrivals[1].timeToArrival/60).should.equal(10)
      Math.ceil(arrivals[3].timeToArrival/60).should.equal(20)
      Math.ceil(arrivals[4].timeToArrival/60).should.equal(25)
      Math.ceil(arrivals[5].timeToArrival/60).should.equal(30)
      done();
    })

  });



  it('returns no trains if Darwin has none', function (done) {

    var noTrains = fs.readFileSync('./test/data/multipleTrainsEmpty.xml').toString()
    nockRet.reply(200,noTrains)

    trainStop.loadArrivals(null, function (e,arrivals) {
      arrivals.should.deep.equal([])
      done();
    })
  });

  it('reports if Darwin returned a bad response due to internal error', function (done) {

    nockRet.reply(503,'Simulated 503 error')

    trainStop.loadArrivals(null, function (e,arrivals) {
      e.should.equal('Failed to contact Darwin: (503) Simulated 503 error')
      done();
    })
  });

  /*
  it('reports if Darwin request times out', function (done) {

    nockRet.socketDelay(10000)

    trainStop.loadArrivals(null, function (e,arrivals) {
      e.should.equal('Failed to contact Darwin: ESOCKETTIMEDOUT')
      done();
    })
  });
  */


  it('reports if Darwin returned a bad response due to client error', function (done) {

    nockRet.reply(401,'Simulated Bad authorization')

    trainStop.loadArrivals(null, function (e,arrivals) {
      e.should.equal('Failed to contact Darwin: (401) Simulated Bad authorization')
      done();
    })
  });


  afterEach (function () {
    nock.cleanAll()
    b = null
    trainStop = null
  })

});
