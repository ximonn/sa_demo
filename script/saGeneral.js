/*
 * ShopAunt grid demo
 * https://www.shopaunt.com/sa_demo/sa_demo.html
 * Copyright 2013, ShopAunt
 * Licensed under the MIT or GPL Version 2 licenses.
 * Date: 2013-06-11
 *
 * Copyright (C) 2012 - 2013 by ShopAunt (AVportable)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
/** @const */
var LOG = false;  // general logging
/** @const */
var LOGQ = false;  // used for screen dimension (small or big) debugging
/** @const */
var LOGY = false;  // used for firefox iFrame debugging
/** @const */
var SSLOG = false; // used for saSession debugging (socket.io connection with backend)
/** @const */
var TLOG = false; // used for image loading debugging
/** @const */
var LOGM = false; // development logging, to be cleaned after each use.
/** @const */
var LOGI = false; // intersect debugging
/** @const */
var LOGA = false; // debugging
/** @const */
var LOGSVG = false; // SVG parsing debugging
/** @const */
var LOGU = false; //

/** @const */
var saFont = "1.0em futurabook"; //"1.0em ABeeZee"; //"Bold 12pt ABeeZee";
/** @const */
var saFontBold = "1.0em futurabold"; //"Bold 1.0em ABeeZee";

/** @const */
var saFontFamily = "futurabook, ABeeZee, Arial"; // Arial

/** @const */
var saFontFamilyBold = "futurabold, ABeeZee, Arial"; // Arial

// if this page is run locally, without server available
var localDev = (window.location.host).toLowerCase().indexOf("shopaunt-new.local") != -1 ? true : false;

/**
 * Retrieve an option from URL (form / get mechanism)
 * @param key
 * @return {String}
 * @private
 */
function _getUrlVar(key){
  var result = new RegExp(key + "=([^&]*)", "i").exec(window.location.search);
  result = result && decodeURI(result[1]) || "";

  // remove any chars other than the ones who I expect (so also funky ones like: ` )
  if (result) {
    var checkVar = new RegExp("[^a-zA-Z0-9]+","g");
    result = result.replace(checkVar,"");
  }

  return result;
}

function capitaliseFirstLetter(string)
{
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getCssNumber(fieldID, propertyName) {
  var text = $(fieldID).css(propertyName);
  if (!text) {
    text = "0";
  }
  return Number(text.replace(/\D/g,''))
}

// load event will not wait for the dynamic loaded scripts:
function dynamicLoadScript(source) {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = source;
  document.getElementsByTagName("head")[0].appendChild(script);
}
window['dynamicLoadScript'] = dynamicLoadScript;


var hideCounter = 0;

function showLoading(setVal) {
  if (!localDev) {
    hideCounter++;
    if (hideCounter == 1) {
      $('#divwaitforserver').show();
    }
    if (setVal) {
      hideCounter = setVal;
    }
  }
}
function clearLoading() {
  if (!localDev) {
    hideCounter--;

    if (hideCounter <= 0) {
      $('#divwaitforserver').hide();
    }
  }
  else {
    $('#divwaitforserver').hide();
  }
}



/**
 * init to default if no value available for option (applicable for backbone model)
 * @param option
 */
/*
function assureValue(option, that) {
  if (!that.get(option) && that.defaults) {
    var value = {};
    value[option] = that['defaults']()[option];
    console.log("set for ",that," option:",option," value:",value[option]);
    that.set(value);
  }
}

function assureAllValues(that) {

  var d = "title";

  console.log(" ##### ",that['defaults']()[d]," model:",that.get(d));

  var defaults = that['defaults']();
  for (var name in defaults) {
    console.log(" assureValue [",name,"]");
    assureValue(name, that);
  }
}
*/

//todo: move other methods within saGeneral scope as well
var saGeneral = (function () {

  var my = {};

  var _state = [];

  // store state in history as well as in _state array
  my.pushState = function(s, description, locator) {
    history.pushState(s, description, locator);

    _state.push(s);
  }

  // give previous state, to be used in window.onpopstate
  my.popState = function() {
    var result = null;

    if (_state.length) {
      result = _state.pop();
    }

    return result;
  }

  my.triggerPopState = function(target) {
    var result = null;
    if (!target) {
      if (_state.length) {
        history.go(-1);
      }
    }
    else {
      var n = 0;
      var slength = _state.length;
      while (--slength && !result) {
        n++;
        if (_state[slength]['filter'] == target) {
          result = target;
        }
      }
      if (result) {
        history.go(-n);
      }
    }
    return result;
  }

  my.closeAndPopState = function(closeMethod, that, targetState) {
    var result = closeMethod.apply(that);
    if (result) {
      result = my.triggerPopState(targetState);
    }
    return result;
  }

  // todo: fancybox isnt used atm..!
  /*var fancyBoxInitialized = false;
  my.prepareFancyBox = function() {
    if (!fancyBoxInitialized) {
      fancyBoxInitialized = true;
      $(".fancypopup")['fancybox']({
        'maxWidth'	: 800,
        'maxHeight'	: 600,
        'scrolling' : 'auto',
        'preload'   : true
      });
    }
  }*/

  my.pageActive = true; // onload status

  /**
   * prepareForBackground <- called when view loses focus
   * returnFromBackground <- called when view regains focus
   */
  my.registerFocusCallbacks = function(that, prepareForBackground, returnFromBackground) {
    //******************************************
    // checks for when page goes out of view and comes back into view
    //
    // from: http://stackoverflow.com/questions/1060008/is-there-a-way-to-detect-if-a-browser-window-is-not-currently-active
    //
    // this FAILS in SAFARI: an iFrame getting focus will trigger deactivate (false detections of losing focus)
    //   so I implemented a timeout to go to background.
    //
    //******************************************
    var hidden, change, vis = {
      'hidden': "visibilitychange",
      'mozHidden': "mozvisibilitychange",
      'webkitHidden': "webkitvisibilitychange",
      'msHidden': "msvisibilitychange",
      'oHidden': "ovisibilitychange" /* not currently supported */
    };
    for (hidden in vis) {
      if (vis['hasOwnProperty'](hidden) && hidden in document) {
        change = vis[hidden];
        break;
      }
    }
    if (change) {
      document.addEventListener(change, onchange);
    }
    else if (/*@cc_on!@*/false) {// IE 9 and lower
      document.onfocusin = document.onfocusout = onchange;
    }
    else {
      window.onfocus = window.onblur = onchange;
    }

    function onchange (evt) {
      var body = document.body;
      evt = evt || window.event;

      if (evt.type == "focus" || evt.type == "focusin") {
        activatePage();
      }
      else if (evt.type == "blur" || evt.type == "focusout") {
        deactivatePage();
      }
      else {
        if (my.pageActive) {
          deactivatePage();
        }
        else {
          activatePage();
        }
      }
    }

    // --- helper methods ---------

    var deactivateTimer = null;

    function deactivatePage_now() {
      if (my.pageActive == true) {
        body.className = "hidden";
        prepareForBackground.apply(that);
        my.pageActive = false;
      }
    }

    function deactivatePage() {
      if (deactivateTimer) {
        clearTimeout(deactivateTimer);
        deactivatePage = null;
      }

      // deactivate if page isnt at top focus after an hour -> use may use a small window partially covering our page.
      // witohut the safari issue we could deactivate immediately
      deactivateTimer = setTimeout(deactivatePage_now, 3600000);
    }

    function activatePage() {
      if (deactivateTimer) {
        clearTimeout(deactivateTimer);
        deactivatePage = null;
      }
      if (my.pageActive == false) {
        my.pageActive = true;
        body.className = "visible";
        returnFromBackground.apply(that);
      }
    }

  }

  return my;
}());


