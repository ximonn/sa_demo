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

/**  @constructor
 *
 * saGridView is the basic grid view, it provides the functions to manage items on the grid
 *
 * it gets a reference of a list of items to display (this.collection)
 * items can be added or removed from the grid (addOne, removeOne)
 * the items are displayed in the order of the list (the order can be externally set, e.g. by a sort method)
 * displayed items are spread over as much as layers as needed
 *
 * it knows
 *  each item
 *   + has a model - which contains a position (where it is desired to be located)
 *   + has a view - which is the graphical representations of the model. A view has a position (where it is actually located).
 *  the grid has
 *   + one or more layers
 *
 * It does NOT do:
 *   - filtering
 *   - sorting
 *   - layer controls are not managed by this module, dash buttons are not managed by this module
 *
 * It does:
 *   + manage layers (saLayers)
 *   + manage screen parameters (child can bind to this.screen.on('change',..))
 *
 */
var saGridView = (function () {

  LOG && console.log("saGridView init");

  var focusCallbacks = [];
  var blurCallbacks = [];

  var my = Backbone.View.extend({

    envelopeModelViewCollection : [],

    'initialize': function() {
      var that = this;

      // multiple viewModel types can be used in parallel
      //   models need to have a '_id' field and 'position' field.
      //this.viewmodelCollection = [];
      this.initViewModelCollection();

      // todo: define functione - not dynamic create it
      $(window).resize(function() {
        LOG && console.log("$(window) resized");
        that.resized();
      });

      window.onorientationchange = this.updateOrientation;

      // Hide address bar, for iPhone / safari
      // todo: define functione - not dynamic create it
      window.addEventListener("load",function() {
        setTimeout(function(){
          // Hide the address bar!
          window.scrollTo(0, 1);
        }, 0);
      });

      saGeneral.registerFocusCallbacks(this, this.prepareForBackground, this.returnFromBackground);
    },

    prepareForBackground: function() {
      LOG && console.log("prepareForBackground() override it in child if you need it");
    },

    returnFromBackground: function() {
      LOG && console.log("returnFromBackground() override it in child if you need it");
    },

    /** @constructor calculate intended position of the boxgroup based on its new position */
    gridIndexFor: function (npos, nr, offset_n) {
      LOG && console.log("sgv gridIndexFor");

      // correct for h-offset added in case nr of boxes is smaller than that fit on one line.
      var hOffset = this.screenPos.getGridHoffset (nr + offset_n);

      npos.x = npos.x - hOffset;

      //LOG && console.log("hOffset: ",hOffset," this.screenPos.ox: ",this.screenPos.ox," this.screenPos.xstep: ",this.screenPos.xstep);
      //LOG && console.log("hOffset: ",hOffset," this.screenPos.oy: ",this.screenPos.oy," this.screenPos.ystep: ",this.screenPos.ystep);

      // calculate grid position based on coordinates
      var bg_current_n = ((npos.x + (this.screenPos.xstep/2) - this.screenPos.ox) / this.screenPos.xstep) | 0;
      bg_current_n += (((npos.y + (this.screenPos.ystep/2) - this.screenPos.oy) / this.screenPos.ystep) * this.screenPos.h) | 0;

      // limit calculated position to positions within the grid
      if (bg_current_n >= this.screenPos.npage) {
        bg_current_n = this.screenPos.npage -1;
      }
      if (bg_current_n < 0) {
        bg_current_n = 0;
      }
      // limit within max
      if (bg_current_n > nr -1) {
        bg_current_n = nr - 1;
      }
      return bg_current_n;
    },

    /** @constructor */
    setCollection: function(collection, viewModelCollection) {
      LOG && console.log("sgv setCollection");
      this.collection = collection;

    },

    initViewModelCollection: function() {
      this.viewmodelCollection = [];
    },

    addViewModelCollection: function(viewModelCollection) {
      this.viewmodelCollection.push(viewModelCollection);
    },

    /** @constructor */
    updateGridPos: function (envelope) {
      LOG && console.log("sgv update gridpos");
      // This method will determine what the new position in the grid of boxgroup is, assuming the user
      // dragged boxgroup by mouse or touch.
      // After determining the new position, this method will update the gridpos variables accordingly that when
      // the items are repostioned, boxgroup is put at its new position in the grid and the other boxes are moved
      // to fill the empty space.

      // how many envelopes are on the page?
      var envelopeLayer = saLayers.getActiveLayer();
      var nr = envelopeLayer.envelopeCount;

      var offset_n = this.screen.get('activeLayer') * this.screenPos.npage;

      var pos = envelope.viewModel.get("position");

      //LOG && console.log(" pos:",pos.x,",",pos.y);

      var current_n = this.gridIndexFor(pos, nr, offset_n) + offset_n;

      var old_n = this.collection.indexOf(envelope["model"]);

      LOG && console.log("current_n:",current_n," old_n:",old_n);

      var moved = this.collection.move(old_n, current_n);

      return moved;
    },


    /** @constructor
     * Calculate constant pixel lengths and positions for the view, based on screen size.
     */
    screenPositionData: function(x, y, width, height, myXstep, myYstep, topPadding) {
      LOG && console.log("sgv screenPositionData");
      var nrItemsOnScreen = 0;
      var hOffset = 0;
      if (!myXstep || !myYstep) {
        myXstep = 200; //px default
        myYstep = 200; //px default
      }
      this.xstep = myXstep; //200; //px customXstep
      this.ystep = myYstep; //200; //px customYstep
      this.width = width;
      this.height = height; // reserve 40px for bottom tab
      this.x = x;
      this.y = y;
      this.gridHeight = height;
      if (typeof(saLayerControl) != "undefined") {
        this.gridHeight -=  saLayerControl.bottomPanelSize.height;
      }
      if ($('#background').length) {
        //this.voffset = Number($('#background').css('top').replace(/\D/g,'')); //69; // <-- space for the header //$('#divgridCanvas').height() - $('#background').height();
        this.voffset = getCssNumber('#background','top');
      }
      else {
        this.voffset = 0;
      }

      if (topPadding) {
        this.topPadding = topPadding; // preserve value for re-init

        this.voffset += this.topPadding;
      }


      var topHeader = $('#divtopheader');
      // is topHeader available?
      if (topHeader.length) {
        var top = topHeader.position().top;
        var height = topHeader.height();

        LOG && console.log("topHeader top:",top," height:",height);

        this.voffset += top + height;
      }


      //LOG && console.log(" css:",$('#background').css('top'),"  number:",this.voffset);

      this.divgridtop = $('#divgridCanvas').position().top;
      this.vbottomoffset = 70; //110

      LOG && console.log("divgridtop:",this.divgridtop," voffset:",this.voffset," gridheight:",this.gridHeight," height:",height);


      // calculate how many boxes fit on one page
      this.h = ((width - this.xstep/2)/this.xstep) | 0; // rounded down
      this.v = ((this.gridHeight - this.voffset - this.vbottomoffset) / this.ystep) | 0; // rounded down

      // guarantee minimum space - else the app will fail
      if (this.v == 0) {
        this.v = 1;
      }
      if (this.h == 0) {
        this.h = 1;
      }
      this.npage = this.h * this.v;

      this.ox = (x + ((width / 2) - (this.xstep * this.h)/2)) | 0;

      // determine the vertical offset for the first row of boxes
      //var min_headerY_to_boxY = this.gridHeight / 15;
      //if (min_headerY_to_boxY < 30) { // pixels
      min_headerY_to_boxY = 20;
      //}

      // textArea width, for editor, due to width of scroll is dynamic, the text area widht is also dynamic.
      this.taWidth = 0;

      this.oy = y + this.voffset + min_headerY_to_boxY; // allow for a finger distance

      // calculate Y position for navi-circles
      var ry = (this.oy + (this.ystep * this.v) + 2) | 0;
      var cy = this.gridHeight - 24; //this.oy + (this.ystep * this.v) + 2 + (this.gridHeight - ry)*0.5;
      this.cy = y + cy;

      this.getNrItemsOnScreen = function() {
        return nrItemsOnScreen;
      };
      this.setNrItemsOnScreen = function(nr) {
        nrItemsOnScreen = nr;

        // buffer value for horizontal pixel offset for last page
        hOffset = this.getGridHoffset();

        LOG && console.log("setNrItemsOnScreen:",nr," -> hOffset:",hOffset);
      };

      // Calculate horizontal pixel offset in case nr of boxes is lower than what fits on one line.
      // Enabling centering the boxes in that case.
      this.getGridHoffset = function(nr) {
        var _nr = nr;
        var hOffset_local = 0;
        if (!nr) {
          _nr = nrItemsOnScreen;
        }

        while (_nr > this.npage) {
          _nr = _nr - this.npage;
        }

        if (_nr < this.h) {
          var nrEmpty = this.h - _nr;
          hOffset_local = ((nrEmpty * this.xstep)/2) | 0;
        }

        return hOffset_local;
      };


      // calculate x,y position for an envelope, based on its position in storage.
      this.getPos = function (index) {
        var extra_hOffset = 0;

        LOG && console.log(" getPos nrItemsOnScreen:",nrItemsOnScreen);
        // is index in last layer?
        if (Math.floor((nrItemsOnScreen-1)/this.npage) === Math.floor(index/this.npage)){
          extra_hOffset = hOffset;
        }

        // calculate index on the layer
        while (index >= this.npage && index > 0) {
          index -= this.npage;
        }

        try //todo: cleanup this try block
        {
          if (index < 0) {
            index = 0;
            throw Error('index ('+index+') is negative - something wrong with npage size:'+this.npage);
          }
        }
        catch(err) {
          LOG && console.log("error:",err);
        }
        //LOG && console.log("getPos, extra_hOffset:",extra_hOffset," index:",index);

        // calculate x,y position for index
        var y = 0;
        while (index >= this.h) {
          index -= this.h;
          y++;
          //LOG && console.log(" y++ ",y);
        }
        var x = index;

        //LOG && console.log(" final x,y == ",x,",",y);

        var pos = { x: (this.ox + x*this.xstep + extra_hOffset), y: (this.oy + y*this.ystep) };
        return pos;
      };

      // x pos for envelope
      this.getX = function(index) {
        return this.getPos(index).x;
      };

      // y pos for envelope
      this.getY = function(index) {
        return this.getPos(index).y;
      };

      this.getLastIndexForLayer = function(index) {
        var n = 0;
        n = this.npage * index + this.npage - 1;
        return n;
      };

      //return this;
    },


    /** @constructor
     * move envelope (identified by viewData or _id) to (pos.x, pos.y)
     */
    repositionBoxToPos: function(id, pos, viewData) {
      LOG && console.log("repositionBoxToPos");
      if (!viewData) {
        // get viewData by _id
        var length = this.viewmodelCollection.length;
        for (var n=0; n < length && !viewData; n++ ) {
          viewData = _.find(this.viewmodelCollection[n]['models'], function(model) {return model.get("_id") === id;});
        }
      }

      LOG && console.log("  repositionBoxToPos viewData:",viewData,"  pos:",pos.x,",",pos.y);

      if (viewData) {
        var oldPos = viewData.get("position");
        if (pos.x != oldPos.x || pos.y != oldPos.y) {
          LOG && console.log("  repositionBox ",id," - move from ",oldPos.x,",",oldPos.y," to ",pos.x,",",pos.y);

          // make sure a change event is fired
          //viewData.unset("position",{silent:true});

          viewData.set("position",pos);

        }
        else {
          LOG && console.log("  repositionBoxToPos viewData already has that pos as target..");
        }
      }
      else {
        LOG && console.log("error (saGridView.js): viewData not available");
      }
    },

    /** @constructor
     * move all boxes to their expected location on screen (put them in the grid).
     */
    repositionBoxes : function (layerIndex) {
      LOG && console.log("repositionBoxes");

      var index = layerIndex * this.screenPos.npage;

      if (index >= 0 && this.collection) {
        // position, based on order in the collection of models
        LOG && console.log(" repositionBoxes start:",index," nr:",this.screenPos.npage," screenPos:",this.screenPos);
        for (var n = index; n < index + this.screenPos.npage && n < this.collection.length; n++) {
          var pos = this.screenPos.getPos( n );

          var model = this.collection.at(n);

          var _id = model.get('_id');

          LOG && console.log(" repositionBoxes for index ",n," id: ",_id,"    pos:",pos.x,",",pos.y);
          if (_id == 30) {
            LOG && console.log(" !!");
          }
          this.repositionBoxToPos(_id, pos);
        }
      }
    },


    // candidate saGridView.js
    // parameters are optional, if not specified: activeLayer and default waitTime is used.
    //  item: can be a envelopeModelView or a saLayers.layer.
    //  waitTimeOptional: time in milliseconds
    repositionBoxesDelayed : function(item, waitTimeOptional) {
      LOG && console.log("sgv repositionBoxesDelayed");
      var myWaitTime = 150; //[ms]  default
      if (waitTimeOptional !== undefined) {
        myWaitTime = waitTimeOptional;
      }

      LOG && console.log("reposition boxes delayed!");

      var index = this.screen.get('activeLayer');
      if (item) {
        if (item.view && item.view.options) {
          index = item.view.options.layer.layerIndex;  // is it a view 'model'?
        }
        else if (item.layerIndex) {  // is it a layer object?
          index = item.layerIndex;
        }
        else if (! isNaN (item-0) && item >= 0) {  // is it a layer index already?
          index = item;
        }
      }

      LOG && console.log("repositionBoxesDelayed for layer#",index);

      var that = this;
      if (!that.idReposTimer) {
        // todo: define functione - not dynamic create it
        that.idReposTimer = setTimeout(function() {
          that.repositionBoxes(index);
          clearTimeout(that.idReposTimer);
          that.idReposTimer = null;
        }, myWaitTime);
      }
    },

    setActiveLayer : function(nr) {
      LOG && console.log("sgv setActiveLayer");
      // check this screen for current activeLayer (note: actual activeLayer in saLayers may have changed, due to swipes).
      var current = this.screen.get('activeLayer');

      if (nr !== current && nr >= 0) {
        // note: importance of order, by repositioning the boxes while the layer is not yet visible is much more efficient than doing it while in view.
        this.repositionBoxes(nr);
        LOG && console.log(" setScreen active layer.");
        this.screen.set({'activeLayer' : nr});
        //this.lcModel.set(this.screen);
      }
    },

    /** @constructor
     *
     * all parameters optional
     *
     * */
    initScreenSize : function(gridXstep, gridYstep, topPadding, width, height) {
      var changed = false;
      var divgridtop = 0; //$(window).height() -1;// - divgridHight - 1;
      var divgridHight = 0;
      var smallScreen = false;

      // workaround for Safari - sometimes safari is too lazy to determine divgridCanvas width from css instructions, so lets do it for it.
      var csswidth = $('#divgridCanvas').css('width');
      var csPercentage = csswidth.indexOf("%");
      var csPixel = csswidth.indexOf("px");
      if (csPercentage > 0) {
        var p = Number(csswidth.substring(0, csPercentage));
        csswidth = ($('body').innerWidth() * p / 100) | 0;
      }
      else if (csPixel > 0) {
        csswidth = Number(csswidth.substring(0, csPixel));
      }
      else {
        csswidth = 0; // other unit used ..
      }

      if (!width) {
        width = csswidth ? csswidth : $('#divgridCanvas').width();
      }
      if (!height) {
        height = $('#wrapper_category').height(); //$('#divgridCanvas').height(); <-- changed to wrapper_category , for iPad orientation change..
        if (!height) {
          // backup - if no wrapper_category is available, e.g. in demo mode.
          height = $('#divgridCanvas').height();
        }
      }

      // if no topPadding is given, try to recycle old value
      if (topPadding == undefined && this.screenPos) {
        topPadding = this.screenPos.topPadding;
      }

      // this bit was for when the app didnt use vertical scrolling..
      /*if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i)) || (navigator.userAgent.match(/iPad/i))) {
        smallScreen = true;

        if (window.navigator.standalone) {
          // we are in app mode
          // no need to add space, we have the full screen
        }
        else {

          var scale = 0.5; // see meta name="viewport"
          var addressbarsize = (60 / scale) | 0;

          divgridtop -= addressbarsize; // add 60 pixels that were reserved for the addressbar
          // todo: android: 56 pixels

          // correct divgridCanvas size.
          divgridHight += addressbarsize;
          $('#divgridCanvas').height(divgridHight);
        }
      }*/

      /*var xOffset = $('#divgridCanvas').width() * 0.1;
       screenPos = new screenPositionData(
       xOffset,
       0,
       $('#divgridCanvas').width() - xOffset*2,               // available window width
       $('#divgridCanvas').height()  // - divgridtop  // available window height
       );*/

      var tsp = this.screenPos;
      if (tsp && tsp.width == width && tsp.height == height && tsp.xstep == gridXstep && tsp.ystep == gridYstep) {
        changed = false;
      }
      else {
        changed = true;
        this.screenPos = new this.screenPositionData(
          0,
          0,
          width, //$('#divgridCanvas').width(),  // available window width
          height, //$('#divgridCanvas').height(),  // - divgridtop  // available window height
          gridXstep,
          gridYstep,
          topPadding
        );

        //screenPos.divgridtop = $('#divtop').height(); //divgridtop;
        this.screenPos.smallScreen = smallScreen;

        LOG && console.log("initScreenSize this:",this," dimension:",this.screenPos.width,",",this.screenPos.height);
        LOG && console.log(" divgridtop:",this.screenPos.divgridtop," innerHeight:",window.innerHeight);
        LOG && console.log(" screenPos:",this.screenPos);
      }
      return changed;
    },

    resized : function(callback) {
      LOG && console.log("sgv resized");
      var that = this;
      if (!this.resizeTimeout) {
        // todo: define functione - not dynamic create it
        this.resizeTimeout = setTimeout(function() {

          // re-init screen size, but preserve grid steps
          var updated = that.initScreenSize(that.screenPos.xstep, that.screenPos.ystep, that.screenPos.topPadding);

          if (updated) {
            LOG && console.log("resized, getStage at saGridView");

            saLayers.resized();

            that.screenPos.setNrItemsOnScreen(that.collection.length);

            // update models that use screenPos
            that.screen.set({'position' : that.screenPos});

            that.updateLayers();

            $('#divgridCanvas').focus();

            if (callback) {
              callback();
            }
          }

          clearTimeout(that.resizeTimeout);
          that.resizeTimeout = null;
        }, 300); //[msec]
      }
    },

    /** @constructor */
    screenModel: Backbone.Model.extend({
      // Default attributes for the envelopeModel item.
      'defaults' : function() {
        return {
          'position' : {},    // screenPos object
          'layerLength' : 0,  // integer: number of layers holding envelopes
          'activeLayer' : 0
        };
      },

      /** @constructor */
      'initialize' : function() {
      },

      /** @constructor */
      'clear' : function() {
        this.destroy();
      }
    }),

    /** @constructor */
    initScreenModel: function(arg) {
      this.screen = new this.screenModel(arg);
    },

    addOne : function(envelopeModel, modelViewController) {
      LOG && console.log("sgv addOne");

      // get layer
      var layer = saLayers.getLastLayer();
      if (layer == null) {
        layer = this.addLayer();
      }
      // check if there is room in the layer, if not add a new one
      var population = layer.envelopeCount;
      if (population >= this.screenPos.npage) {

        // get new layer to continue on
        layer = this.addLayer();
      }

      // if not set already -> set xstep and ystep to the grid
      var envXstep = envelopeModel.get("xstep");
      if (!envXstep) {
        envelopeModel.set({'xstep':this.screenPos.xstep})
      }
      var envYstep = envelopeModel.get("ystep");
      if (!envYstep) {
        envelopeModel.set({'ystep':this.screenPos.ystep})
      }

      // create and add new envelope

      var shapeAttributes = {
        'model' : envelopeModel,                  // contains all attributes needed to visualize the shape
        layer : layer,                          // layer the shape should be drawn on
        position : this.getPos(envelopeModel),  // position the shape will have
        event : _.extend({}, Backbone.Events)   // clean event, for communication between 'child'grid view and viewController
      };

      LOG && console.log(" saGridView addOne layerIndex:",layer.layerIndex," layer:",layer);

      // create shape
      var shape = new modelViewController(shapeAttributes);

      this.envelopeModelViewCollection.push(shape);

      layer.envelopeCount++;

      if (!this.collection.saBulkAdd) {
        this.screenPos.setNrItemsOnScreen(this.collection.length);

        // as items are sorted, last added item may be on activeLayer on sort.
        // so at the end, position boxes for the active layer.
        LOG && console.log(" repositionBoxes for layer:",saLayers.getActiveLayerIndex());   //layer.layerIndex);
        this.repositionBoxes(saLayers.getActiveLayerIndex());
      }

      if (!this.collection.saBulkAdd) {
        // due to comparator, the newly added item maybe at the start and not simply at the end
        // in that case all items need to be relayered.
        this.relayer();

        saLayers.draw();
      }

      return shape;
    },


    /**
     * remove one from grid
     * @param envelopeModel
     * @return {shape} - note: caller is responsible to remove the shape from its layer
     */
    removeOne : function(envelopeModel) {
      LOG && console.log("sgv removeOne");
      var that = this;

      var shape = _.find(that.envelopeModelViewCollection, function(oneShape) { return (oneShape["model"] === envelopeModel); });
      if (shape) {
        LOG && console.log(" removeFilteredOne ",shape);
        // remove item from envelopeModelViewCollection
        var index = _.indexOf(that.envelopeModelViewCollection, shape);
        that.envelopeModelViewCollection.splice(index, 1);

        this.screenPos.setNrItemsOnScreen(this.collection.length);
      }
      return shape;
    },

    /**
     * Move item one layer up or down
     * @param item
     * @param step (+1 or -1)
     */
    itemMoveLayer : function(item, step) {
      LOG && console.log("sgv itemMoveLayer");
      LOG && console.log("app handling move to Layer");
      var index = _.indexOf(this.collection["models"], item["model"]);
      var srcLayer = item.view.options.layer; // danger: var *** layer *** can be out of date.
      var layerIndex = srcLayer.layerIndex;
      var targetLayerIndex = layerIndex + step;

      if (targetLayerIndex >= 0 && targetLayerIndex < saLayers.length()) {
        var targetIndex = -1;
        var pos = item.viewModel.get("position");

        // determine target layers index and calculate x - position to put it on screenborder
        if (step === (-1)) {
          targetIndex = this.screenPos.getLastIndexForLayer(targetLayerIndex);
          pos.x = this.screenPos.width - 2;
        }
        else if (step === (+1)){
          targetIndex = this.screenPos.getLastIndexForLayer(layerIndex) + 1;
          pos.x = -(this.screenPos.xstep) + 2;
        }

        var destLayer = saLayers.getLayerByIndex(targetLayerIndex);

        // first update order in collection
        LOG && console.log("moving in collection item from ",index," to ",targetIndex);
        this.collection.move(index, targetIndex);
        // note: the item at targetIndex gets pushed one position deeper, hence to the start pos at the next page.

        // after collection order change, update the layer for each modelView.view
        this.relayer(destLayer.layerIndex);

        // prepare for grand entrance - position item so a dragout looks like a jump
        item.viewModel.set("position", pos);

        // update activeLayer now:
        this.setActiveLayer(destLayer.layerIndex);
        //saLayers.setActiveLayerByIndex(destLayer.layerIndex);

        // prevent layer dragging to mess up item move
        //srcLayer.setDraggable(false);
        //destLayer.setDraggable(false);

        this.repositionBoxesDelayed(item, 300); // start it a bit later so the layer animation is for a big part done, before the box is put on its correct place.
      }
      else {
        LOG && console.log("repositionDelayed1 ",item);
        item.repositionDelayed(150);
      }
    },

    getPos : function(envelopeModel) {
      LOG && console.log("sgv getPos");
      var index = _.indexOf(this.collection["models"], envelopeModel);
      var pos = this.screenPos.getPos(index);

      return pos;
    },

    repositionShape : function(envelope) {
      LOG && console.log("sgv repositionShape");
      var currentPos = envelope.viewModel.get("position");

      var expectedPos = this.getPos(envelope["model"]);

      if (currentPos.x != expectedPos.x ||
        currentPos.y != expectedPos.y) {
        envelope.viewModel.set("position",expectedPos);
      }
    },

    addLayer : function() {
      LOG && console.log("sgv addlayer");
      var layer = saLayers.createLayer();
      layer.envelopeCount = 0;

      this.screen.set({'layerLength': saLayers.length()});

      return layer;
    },

    getModelviewByModel: function(model) {
      var modelView = _.find(this.envelopeModelViewCollection, function(aView) {
        return aView["model"] === model;
      });
      return modelView;
    },

    // candidate saGridView.js
    // update for each collection 'model' the layer
    relayer : function(targetLayerIndex) {
      LOG && console.log("sgv relayer");
      var n = 0;  // counter for: total number of envelopes processed
      var np = 0; // counter for: total number of envelopes at layer
      var that = this;

      // start with first layer, there is always at least one layer.
      var lindex = 0;
      var layer = saLayers.getLayerByIndex(lindex);

      if (layer) {
        layer.envelopeCount = 0;

        // walk through collection in its particular order, to repopulate the layers.
        _.each(that.collection["models"], function(model) {

          /*var modelView = _.find(that.envelopeModelViewCollection, function(aView) {
            return aView["model"] === model;
          });*/
          var modelView = that.getModelviewByModel(model);

          if (!modelView || !modelView.view) {
            // timing issue - the modelView for the model is not yet generated.. so ignore it.
            // todo: fix timing issue observed on iPad
          }
          else {

            // set modelView.view to layer, pass modelView.view as this, with argument array
            var moved = modelView.view['moveToLayer'].apply( modelView.view, [ layer ]);
            if (moved) {
              LOG && console.log("moved layer for ",modelView," to layerIndex ",lindex,"  MODELVIEWOPTIONS: ",modelView.view.options.layer.layerIndex);
            }
            layer.envelopeCount++;

            n++;

            // layer full? then select next layer
            np++;
            if (np === that.screenPos.npage) {
              np = 0;
              lindex++;
              layer = saLayers.getLayerByIndex(lindex);
              if (layer) {
                layer.envelopeCount = 0;
              }
            }
          }
        });

        // once all items are on the correct layer, reposition them

        // commented out - for performance: this is done when the layer is needed in view, not pre-emtive.
        /*for (lindex = 0; lindex < saLayers.length(); lindex++){
         layer = saLayers.getLayerByIndex(lindex);

         // repos only the non active layers immediately..
         if (targetLayerIndex != lindex) {
         LOG && console.log(" immediately repositionBoxes for non active layers");
         //repositionBoxes(layer.layerIndex);
         }
         }*/
      }
    },

    updateLayers : function() {
      LOG && console.log("sgv updateLayers");
      // remove or add layers
      if (this.collection) {
        var length = this.collection.length;

        var nrOfRequiredLayers = Math.ceil(length / this.screenPos.npage);
        var updated = saLayers.updateNrOfLayers(nrOfRequiredLayers);

        // update this.screen 'model'?
        if (updated) {
          this.screen.set({'layerLength': saLayers.length()});
        }

        // respread items over layers
        var al = this.screen.get('activeLayer');
        this.relayer(al);

        // redraw active layer
        saLayers.draw();

        this.repositionBoxesDelayed(al, 200);
      }
    },

    getLayerIndexForModel: function(specificModel) {
      var lIndex = -1;

      var index = _.indexOf(this.collection["models"], specificModel);

      if (index != -1) {
        lIndex = (index / this.screenPos.npage) | 0;
      }

      return lIndex;
    },

    registerBlurCallback : function(callback, that) {
      if (that == undefined) {
        that = this;
      }
      blurCallbacks.push({cb:callback, me:that});
    },

    registerFocusCallback : function(callback, that) {
      if (that == undefined) {
        that = this;
      }
      focusCallbacks.push({cb:callback, me: that});
    },

    /**
     * allow child class to override methods and still call this methods by _super('methodName');
     * @param funcName
     * @return {*}
     * @private - not really
     *
     * Important to note: if child calls _super, for any other methods that are overridden by the child - the childs version is called!
     * e.g. child calls _super(updateLayers); -> updateLayers calls 'relayer' (if child has overridden relayer, that one will be called).
     */
    _super : function(funcName){
      // translate from text name to functionCall (needed for compatibility with google closure compiler)
      var that = this;
      switch(funcName) {
        case "updateLayers": return that.constructor['__super__'].updateLayers.apply(that, _.rest(arguments)); break;
        case "addLayer": return that.constructor['__super__'].addLayer.apply(that, _.rest(arguments)); break;
        case "removeOne": return that.constructor['__super__'].removeOne.apply(that, _.rest(arguments)); break;
        case "addOne": return that.constructor['__super__'].addOne.apply(that, _.rest(arguments)); break;
        case "resized": return that.constructor['__super__'].resized.apply(that, _.rest(arguments)); break;
        case "setActiveLayer": return that.constructor['__super__'].setActiveLayer.apply(that, _.rest(arguments)); break;
        //case "initialize":
        //  console.log(" initialize super called!");
        //  return that.constructor['__super__'].initialize.apply(that, _.rest(arguments)); break;
        default:
          // no translation needed (funcname is declared as text between ' ' ):
          return that.constructor['__super__'][funcName].apply(that, _.rest(arguments));
      }
    }

  });

  return my;
})();


/*

console.log("saGridView:",saGridView);
console.log("saGridView.constructor:",saGridView.constructor);
console.log("saGridView.constructor['__super__']:",saGridView.constructor['__super__']);
console.log("saGridView.constructor.__super__:",saGridView.constructor.__super__);
// for google compiler, make references from textString function name, to potentially shortened function call names.
saGridView.constructor['__super__']['addLayer'] = saGridView.addLayer;
saGridView.constructor['__super__']['removeOne'] = saGridView.removeOne;
saGridView.constructor['__super__']['addOne'] = saGridView.addOne;
saGridView.constructor['__super__']['updateLayers'] = saGridView.updateLayers;
saGridView.constructor['__super__']['resized'] = saGridView.resized;
*/

/*
window['saGridView'] = saGridView;
window['saGridView']['addLayer'] = saGridView.addLayer;
window['saGridView']['removeOne'] = saGridView.removeOne;
window['saGridView']['addOne'] = saGridView.addOne;
window['saGridView']['updateLayers'] = saGridView.updateLayers;
window['saGridView']['resized'] = saGridView.resized;
console.log("window saGridView set!");
*/