var cfg   = require('config');
var defer = require('config/defer').deferConfig;

module.exports = {

  appName: "get-tfl-travel-options",

  darwinKey "OVERRIDE_ME".

  log: {
    appName: defer(function (cfg) { return cfg.appName } ),
    fileAppender: {
      type:       "file",
      filename:   defer(function (cfg) { return cfg.log.logDir.concat("/" , cfg.appName , ".log" ) }),
      category:   defer(function (cfg) { return cfg.log.appName }),
      reloadSecs: 60,
      maxLogSize: 1024000
    },
    level:   "INFO",
    log4jsConfigs: {
      appenders: defer(function (cfg) { return [cfg.log.fileAppender] }),
      replaceConsole: true
    },
    logDir: "./logs"
  },


  tflStops : [
    {
      name          : "Fiction bus stop",
      naptanId      : "123456",
      vehicleType   : "Bus",
      walkingTime   : "1"
    },
    {
      name          : "Fiction tram stop"
      naptanId      : "789101112",
      platformNames : ["Westbound Platform"],
      vehicleType   : "Tram",
      walkingTime   : "10"
    }
}
