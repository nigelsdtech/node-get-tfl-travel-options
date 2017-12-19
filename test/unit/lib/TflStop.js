var cfg      = require('config');
var chai     = require('chai');
var jsonFile = require('jsonfile');
var nock     = require('nock');
var TflStop  = require('../../../lib/TflStop.js');

/*
 * Set up chai
 */
chai.should();


// Common testing timeout
var timeout = 5*1000;

var tflHost = "https://api.tfl.gov.uk"

var basicStop = {
  name         : "Fiction Tram",
  naptanId     : "1a2b3c4d",
  vehicleType  : "Tram",
  walkingTime  : 0
}

/*
 * The actual tests
 */

describe('TflStop.loadArrivals', function () {

  var tramData = jsonFile.readFileSync('./test/data/multipleTrams.json')
  
  var tflStop, b, nockRet, td
  
  beforeEach (function () {

    nockRet = nock(tflHost, {
      reqheaders: {
        'Accept': 'application/json'
      }
    })
    .persist()
    .get("/StopPoint/1a2b3c4d/Arrivals")

    b = Object.assign({},basicStop)
    td = tramData.slice()
  })


  it('returns valid timeToArrivals for all returned trams in ascending order of arrival', function (done) {

    nockRet.reply(200,td)
    tflStop = new TflStop(b)

    tflStop.loadArrivals(null, function (e,arrivals) {
      arrivals.should.deep.equal([
        {timeToArrival: 733  , vehicleId: "2547"},
        {timeToArrival: 793  , vehicleId: "2542"},
        {timeToArrival: 1693 , vehicleId: "2533"}
      ])
      done();
    })
  });


  it('returns no trams if TFL has none', function (done) {

    nockRet.reply(200,[])
    tflStop = new TflStop(b)

    tflStop.loadArrivals(null, function (e,arrivals) {
      arrivals.should.deep.equal([])
      done();
    })
  });

  it('reports if TFL returned a bad response due to internal error', function (done) {

    nockRet.reply(503,'Simulated 503 error')
    tflStop = new TflStop(b)

    tflStop.loadArrivals(null, function (e,arrivals) {
      e.should.equal('Bad response from TFL: (503) Simulated 503 error')
      done();
    })
  });

  it('reports if TFL request times out', function (done) {

    nockRet.socketDelay(200)
    tflStop = new TflStop(b)

    tflStop.loadArrivals(null, function (e,arrivals) {
      e.should.equal('Failed to contact TFL: Error: ESOCKETTIMEDOUT')
      done();
    })
  });


  it('reports if TFL returned a bad response due to client error', function (done) {

    var tflRespBody = {"$type":"Tfl.Api.Presentation.Entities.ApiError, Tfl.Api.Presentation.Entities","timestampUtc":"2017-12-08T14:29:13.3251187Z","exceptionType":"EntityNotFoundException","httpStatusCode":404,"httpStatus":"NotFound","relativeUri":"/StopPoint/1a2b3c4d/Arrivals","message":"The following stop point is not recognised: 1a2b3c4d"}

    nockRet.reply(404,tflRespBody)
    tflStop = new TflStop(b)

    tflStop.loadArrivals(null, function (e,arrivals) {
      e.should.equal('Bad response from TFL: (404) ' + JSON.stringify(tflRespBody))
      done();
    })
  });

  afterEach (function () {
    nock.cleanAll()
    b = null
    tflStop = null
  })

});
