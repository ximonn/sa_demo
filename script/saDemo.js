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
$(function() {

  var stage;  // Kinetics.js - this module uses one stage.
  var screenPos;

  var demoID = 0; // normally demoID _id comes from mongo DB _id!
  var saDemoModel = Backbone.Model.extend({
    // Default attributes for the envelopeModel item.
    'defaults' : function() {
      return {
        'name' : "",
        '_id' : undefined
      };
    },
    'initialize' : function() {
    },
    // Remove this stuff from *localStorage* and delete its view.
    'clear' : function() {
      this.destroy();
    }
  });

  // locally stored (buffered) collection
  var saDemosModelCollection = Backbone.Collection.extend({

    // Reference to this collection's 'model'.
    'model' : saDemoModel,

    // dont do graphics updates for individual adds during bulk add
    'saBulkAdd' : false
  });

  var demosCollection = new saDemosModelCollection;


  var saDemoModelView = Backbone.View.extend({
    /*'tagName' : "div",
    // Cache the template function for a single item.
    'template' : _.template($('#item-template').html()),
    // The DOM events specific to an item.
    'events' : {
      "click a.destroy" : "clear"
    },*/

    'initialize' : function() {
      var model = this["model"];
      if (model) {
        var pos = this.options.position;
        var name = model.get('name');
        //var shop = name.split('\.')[0];
        var shop = name;
        var viewData = {
          'name': name,
          'shop': shop,
          '_id' : model.get("_id"),
          'position' : pos
        };

        this.viewModel = new saDemoView.saDemoViewModel(viewData);
        var event = this.options.event;
        this.view = new saDemoView.saDemoView({
          'model': this.viewModel,
          layer: this.options.layer,
          viewEvent: event
        });

        event.on("dragged", function() {
          this.options.event.trigger("moved", this);
        }, this);
        event.on("opened", function() {
          var name = this['model'].get("name");
          this.options.event.trigger("openPage", name);
        }, this);
      }
    },

    repositionDelayed : function(timeOut) {
      var that = this;
      var id2 = setTimeout(function() {
        LOG && console.log("repositionDelayed - trigger positionMe");
        that.options.event.trigger('positionMe', that);
        clearTimeout(id2);
        id2 = null;
      }, timeOut);
    }
  });



  /**
   * the demos view app
   */
  (function() {

    var addOnInterval = true;
    var addNow = false; // skip one interval - addNext!
    var demoArray = [];

    // Our overall **AppView** is the top-level piece of UI.
    var DemoView = saGridView.extend({

      'el' : $("#sademos"),

      'initialize' : function() {
        var that = this;
        this._super('initialize');

        // call parent to register callbacks
        this.registerBlurCallback(this.prepareForBackground);
        this.registerFocusCallback(this.returnFromBackground);

        this.initScreenSize();

        LOG && console.log(" initialize ",this);

        screenPos = this.screenPos;

        stage = new Kinetic.Stage({
          'container' : 'divgridCanvas',
          'width' : $('#divgridCanvas').width(),  //window.innerWidth, //
          'height' : $('#divgridCanvas').height() //window.innerHeight //
        });

        // create this.screen
        this.initScreenModel({
          'position': this.screenPos,
          'layerLength' : 0, //saLayers.length(),
          'activeLayer' : 0
        });

        var layersEvent = _.extend({}, Backbone.Events);
        saLayers.initialize(stage, this.screen, layersEvent);
        layersEvent.on("activeLayerChange", this.setActiveLayer, this);

        // set collection which is shown on the grid
        this.setCollection(demosCollection);
        this.initViewModelCollection();
        this.addViewModelCollection(saDemoView.saDemoViewModelCollection);

        // --- layer control ---
        // init control layer
        this.controlLayer = new Kinetic.Layer();
        stage.add(this.controlLayer);
        this.controlLayerTop = new Kinetic.Layer();
        stage.add(this.controlLayerTop);
        var lcViewEvent = _.extend({}, Backbone.Events);
        new saLayerControl.controlView({
          'model' : this.screen,
          layerBottom : this.controlLayer,
          layerTop : this.controlLayerTop,
          viewEvent: lcViewEvent,
          screenModel : this.screen
        });
        lcViewEvent.on("circleClicked", this.circleClicked, this);


        // ---- add items ----
        demosCollection.bind('add', this.addOne, this);
        demosCollection.bind('remove', this.removeOne, this);

        function generateDemo(name) {
          demoID++;
          var a = new saDemoModel({
            'name' : name,
            '_id' : demoID
          });
          demosCollection.add(a);
        }

        demosCollection.saBulkAdd = true;

        demoArray = ['balloons','bolt','carpet','ice','land','sea','statue','sunset'];
        _.each(demoArray, function(demo){generateDemo(demo);});

        demosCollection.saBulkAdd = false;

        this.screenPos.setNrItemsOnScreen(demosCollection.length);

        this.updateLayers();




        $('#divwaitforserver').hide();

        var pointer = 0;
        demoArray.push('tiles','town','tropical','village','wall','waves','window','x');

        // fun bit
        var timerID = setInterval(function() {
          //var layer = saLayers.getActiveLayer();
          //console.log(" activeLayer visible:",layer.isVisible());
          if (addOnInterval && !that.backgroundMode) {
            if (addNow == false) {
              addNow = true;
            }
            else {
              demosCollection.pop();

              pointer--;
              if (pointer < 0) {
                pointer = demoArray.length - 1;
              }

              var name = demoArray[pointer];
              demoID++;
              var a = new saDemoModel({
                'name' : name,
                '_id' : demoID
              })
              demosCollection.unshift(a);

              that.updateLayers();



              LOG && console.log(" added:",name);
            }
          }
        }, 2000);

      },

      addOne : function(demoModel) {
        var oneShape = this._super('addOne',demoModel, saDemoModelView);

        // note: event is used to communicate between envelopeModelView object and here - maybe something to be improved
        var event = oneShape.options.event;

        LOG && console.log(" addFilteredOne:",saFilteredCollection.indexOf(envelopeModel)," subject:",envelopeModel.get("message").subject);

        event.on("changeLayer", function() { LOG && console.log("change layer"); }, this);
        event.on("moved", function(item) {
          // todo: do some funky logic if item is moved - other than repositioning it.

          item.repositionDelayed(150);
        }, this);
        event.on("positionMe", this.repositionShape, this);
        event.on("selected", function() { addOnInterval = false; });
        event.on("unselected", function() { addOnInterval = true; addNow = false; });
        event.on("openPage", function(name) {
          LOG && console.log("open");

          var item = _.find(demoArray, function(item) { return item == name;});
          if (item) {
            alert("You selected: "+name);
            //void(window.open('http://'+item.url));
          }
        }, this);
        event.on("closed", function() { LOG && console.log("close"); }, this);
      },

      removeOne : function(demoModel) {
        var shape = this._super('removeOne',demoModel);

        if (shape && shape.view) {
          shape.view.removeFromLayer.apply( shape.view, [  ]);
        }
      },

      addLayer : function() {
        var layer = this._super('addLayer');

        //control layer needs to be on top
        this.controlLayerTop.moveToTop();

        return layer;
      },

      updateLayers : function() {
        this._super('updateLayers');

        // ensure control layer is on top
        //this.lcModel.set(this.screen.attributes);
        this.controlLayerTop.moveToTop();
      },

      // stop doing stuff thats not needed when user cant see it
      prepareForBackground : function() {
        this.backgroundMode = true;
      },

      // start doing stuff now user comes back!
      returnFromBackground : function() {
        this.backgroundMode = false;
      },

      /*setActiveLayer : function(nr){
        // force staying on the same layer
        if (nr != 0) {
          saLayers.setActiveLayerByIndex(0);
        }
        this._super('setActiveLayer', nr);
      },*/

      circleClicked : function(index) {
        LOG && console.log(" ahaa, circle is clicked: ", index);

        //saLayers.setActiveLayerByIndex(index);
        this.setActiveLayer(index);
      }


    });

      // Finally, we kick things off by creating the **App**.
    var Demos = new DemoView;

    LOG && console.log(" created demoView ");
  })();
});
