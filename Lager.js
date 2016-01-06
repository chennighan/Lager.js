 /*
    Lager.js, a lightweight logging solution.
    Copyright 2016 HennighanDev
    Author: Chris Hennighan
*/

(function(global, $) {
	var Lager = function() {
  		return new Lager.init();
  };

  var eventsLogged_table   = [];
  var eventsLogged_message = '';
  var disabledListenEvents = [];

  // Any methods you'll want Lager to be able to use.
  Lager.prototype = {
    /* The main "logging" function that determines what level to log at and actually
       calls the built in log functions.
    */
    log : function(objToLog, logLevel) {
      // if the log level is passed in accept it, if not reset it from previous attempts
      if(logLevel) {
        this.logLevel = logLevel;
      } else {
        this.setLogLevel();
      }

      switch(this.logLevel) {
        case 'TRACE':
        case 0:
          //console.trace("log level: trace");
          console.trace(objToLog);
          break;
        case 'DEBUG':
        case 1:
          //console.debug("log level: debug");
          console.debug(objToLog);
          break;
        case 'INFO':
        case 2:
          //console.info("log level: info");
          console.info(objToLog);
          break;
        case 'WARN':
        case 3:
          //console.warn("log level: warn");
          console.warn(objToLog);
          break;
        case 'ERROR':
        case 4:
          //console.error("log level: error");
          console.error(objToLog);
          break;
        case 'TABLE': 
        case 5:
          // console.table("log level: table");
          console.table(objToLog);
          break;
        default:
          console.log(objToLog);
          break;
      }
    },

    /* Set your global log level, this is what your default log level will become */
    setLogLevel: function(logLevel) {
      this.logLevel = logLevel;
    },

    // log all elements with the given selector
    logAll: function(selector) {
      if(!$) {
        throw 'you can not use selectors without jQuery in this version of Lager.js';
      } else {
        this.log($(selector));
      }

      return this;
    },

    /* Logs the data of elements based on selector and an array of data attributes. 
       If you want to log data-name, pass the full "data-name" in, not just "name".
       note: we prioritize element naming as such: id --> class --> object

       Using a true value for ignoreErrors will allow you to show multiple data attribute values
       across many elements without worrying about if some elements do not have the correct data
       attributes because you might just want to sweep across all your data and everything will not
       always have all the same data attributes.

       TODO: think about updating to allow the logging of multiple selectors. The only problem I can 
       think of would be that it would slow this down considerably. My theory is if they want to log
       multiple selectors, they're just going to need to write a few more statements in their app.
    */
    logAllData: function(selector, dataAttr, logFormat, ignoreErrors) {
      if(!$) {
        throw 'you can not use selectors without jQuery in this version of Lager.js';
      } else {
        var parent   = this;
        var message  = '';
        var messages = [];
        var elementNameToUse = '';

        $(selector).each(function() {
          elementNameToUse = $(this).attr("id") || $(this).attr("class") || $(this);

          for(var i = 0; i < dataAttr.length; i++) {
            var attrName = dataAttr[i];
            var dataVal = $(this).attr(attrName.toString());

            if(dataVal) {
              messages.push({
                'name'      : elementNameToUse, 
                'attribute' : attrName, 
                'value'     : dataVal
              });

              // if you decide to use non-table mode (for compliance/requirements/etc)
              message += "name: " + elementNameToUse + "\n";
              message += "attribute: " + attrName + "\n";
              message += "value: " + dataVal + "\n" + "\n";
            } else {
              if(!ignoreErrors) {
                parent.log('there was no data attribute: ' + attrName + " found on this element: " + elementNameToUse, 4);
              }
            }
          }
        });  

        if(logFormat == 'table') {      
          this.log(messages, 5);
        } else {
          this.log(message);
        }
      }
    },

    /*  Listen for an event on the selector passed in, and log another selectors data on that event.
        Remember your selector can contain multiple elements, and you're passing in an array of dataAttr's.
    */
    listenAndLogData: function(selectorToListen, specEvent, selectorToLog, dataAttr, logFormat, ignoreErrors) {
      var parent = this;

      if(!$) {
        throw 'you can not use selectors without jQuery in this version of Lager.js';
      } else {
        // helper function for constructing  selectorAndEvent object
        parent.log("Creating the selectorAndEvent object...");
        var selectorAndEvent = createSelectorEventObject(selectorToListen, specEvent);

        // you have to check this on each listenAndLogData call and not on every event, that's why this is up here.
        checkOrRemoveDisabledListenEvents(selectorAndEvent, 1);

        // set up the array you'll use to add each selectorToLog they want to 
        var selectorsToLog = [];

        $(selectorToListen).on(specEvent, function() {
          // This code will be run every time this event fires no matter if the parent event is called or not so we have to do another check.
          var disabled = checkOrRemoveDisabledListenEvents(selectorAndEvent, 0);

          // make sure the selector you're about to use hasn't been disabled
          if(disabled == false) {
            parent.log("it is not disabled...");
            // populate the selectorsToLog by looping through the given selector
            $(selectorToLog).each(function() {
              elementNameToUse = $(this).attr("id") || $(this).attr("class") || $(this);

              // loop through the data attributes and log them if they exist
              for(var i = 0; i < dataAttr.length; i++) {
                var attrName = dataAttr[i];
                var dataVal = $(this).attr(attrName.toString());

                if(dataVal) {
                  if(logFormat == 5 || logFormat == "TABLE") {
                    eventsLogged_table.push({
                      'name'      : elementNameToUse, 
                      'attribute' : attrName, 
                      'value'     : dataVal
                    });
                  } else {
                    eventsLogged_message += "name: " + elementNameToUse;
                    eventsLogged_message += "event: " + specEvent + "\n" + "\n";
                  }
                }
              }
            });
          }
        });        
      }
    },

    /* Allows you to pass in any selector and event combination and still 
       gives you the flexibility of choosing your log format.      
    */
    listenToEvent: function(selector, specEvent, logFormat, ignoreErrors) {
      var parent = this;
      var elementNameToUse = '';
      var disabled = false;

      if(!$) {
        throw 'you can not use selectors without jQuery in this version of Lager.js';
      } else {
        var selectorAndEvent = createSelectorEventObject(selector, specEvent);

        // you have to check this on each listenToEvent call and not on every event, that's why this is up here.
        checkOrRemoveDisabledListenEvents(selectorAndEvent, 1);

        $(selector).on(specEvent, function() {
          // This code will be run every time this event fires no matter if the parent event is called or not so we have to do another check.
          var disabled = checkOrRemoveDisabledListenEvents(selectorAndEvent, 0);

          // make sure the selector you're about to use hasn't been disabled
          if(disabled == false) {
            elementNameToUse = $(this).attr("id") || $(this).attr("class") || $(this);
            
            // you don't want to just populate the table every time, check if they're using it, otherwise just use straight message.
            if(logFormat == 5 || logFormat == "TABLE") {
              eventsLogged_table.push({
                'name'      : elementNameToUse,
                'event'     : specEvent,
                'timestamp' : new Date(Date.now())
              });
            } else {
              // if you decide to use non-table mode (for compliance/requirements/etc)
              eventsLogged_message += "name: " + elementNameToUse;
              eventsLogged_message += "event: " + specEvent + "\n" + "\n";
            }
          }
        });
      }
    },

    /* Allows you to stop logging based on the selector and event you pass in. This
       DOES NOT "off" or disable the event listener itself, it just allows you to 
       stop logging the event based on selector and event.
    */
    disableListenEvent: function(selector, specEvent) {
      var objToPush = {
        'selector'  : selector.selector,
        'specEvent' : specEvent,
        // for comparing selector event objects
        'equals'    : function(other) {
          return other.selector == this.selector && other.specEvent == this.specEvent;
        }
      };

      disabledListenEvents.push(objToPush);
    },

    /* Quick and easy function to show your entire event log */
    showEventLog: function(logFormat) {
      if(logFormat == 'table') {
        this.log(eventsLogged_table, 5);
      } else {
        this.log(eventsLogged_message);
      }
    },

    /* Clear your entire event log */
    clearEventLog: function() {
      eventsLogged_table   = [];
      eventsLogged_message = '';
    }
  };
  
  Lager.init = function() {};    
	Lager.init.prototype = Lager.prototype;  
  global.Lager = global.L$ = Lager;

  /*  Utility method to create a slector+event object  */
  function createSelectorEventObject(selector, specEvent) {
    var selectorAndEvent = {
      'selector'  : selector.selector,
      'specEvent' : specEvent,
      // for comparing selector event objects
      'equals'    : function(other) {
        return other.selector == this.selector && other.specEvent == this.specEvent;
      }
    }

    return selectorAndEvent;
  }

  /*  Utility function to just check if a listen event is in the disabled list, and remove if indicated  */
  function checkOrRemoveDisabledListenEvents(selectorAndEvent, checkOrRemoveInt) {
    var disabled = false;
    // Checking whether the event is in the list, if it is we'll know it's disabled
    if(checkOrRemoveInt == 0) {
      Lager.prototype.log("we are only checkig existence...");
      for(var i = 0; i < disabledListenEvents.length; i++) {
        if(selectorAndEvent.equals(disabledListenEvents[i])) {
          disabled = true;
        }
      }

      return disabled;
    }
    // Removing from disabledListenEvents
    else if(checkOrRemoveInt == 1) {
      Lager.prototype.log("searching disabledListenEvents for the indicated listenEvent...");
      for(var i = 0; i < disabledListenEvents.length; i++) {
        if(selectorAndEvent.equals(disabledListenEvents[i])) {
          disabledListenEvents.splice(i, 1);
          Lager.prototype.log("removed listenEvent sucessfully from disabledListenEvents...");
        }
      }
    } else {
      Lager.prototype.log("Please indicate a checkOrRemoveInt to use this function...");
    }
  }
}(window, jQuery));