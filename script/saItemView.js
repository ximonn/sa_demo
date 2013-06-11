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

/**
 *
 * Provide standard functionality for a view of an item on the saGridView.
 *
 * @type {*}
 */
var saItemView = (function () {

  LOG && console.log("saItemView init");

  var touchDevice = false; // flag to check if this is a touch or mouse controlled device

  var saInterectAvailable = false;
  if (typeof(saIntersect) != "undefined") {
    saInterectAvailable = true;
  }

  var interactBusy = false; // flag to track mouseOver interact between different itemViews.
  var interactBusyID = null; // match mouseOver interact with mouseOut interact

  var saBrandImages = new saImage.Collection;

  saImage.initImage(saBrandImages, "hourglass", "./img/s/hourglass.png");
  //saImage.initImage(saBrandImages, "empty", "/img/s/empty.png");

  var divgridCanvas = $('#divgridCanvas');

  var my = Backbone.View.extend({

    /**
     * Interaction: Dragging and clicking
     *
     * attributes that need to be set by child:
     *
     * this.boxgroup   = boxgroup; // kinetic.group - representing itemView
     * this.brandbox   = boxgroup; // kinetic.node - manipulated to show mousecursor flying by
     * this.shoptext   = null;     // kinetic.node - shown when mousecursor flying by
     * this.activeArea = boxgroup; // if active area is smaller than boxgroup - this could be replaced by imageBuffer see: http://www.html5canvastutorials.com/kineticjs/html5-canvas-pixel-detection-with-kineticjs/
     *
     */
    'initializeDragClick' : function() {
      LOG && console.log(" initializeDragClick ",this);

      var that = this;
      var dragging = false;
      var boxgroup = this.boxgroup;
      var stage = this.options.layer.getStage();

      // add interaction - event handling only if viewEvent is available (desired)
      if (that.options.viewEvent) {
        boxgroup.setDraggable(true);
        boxgroup.isMoving = false; // to track if a movement/dragging is going on, to distinguish touch clicks from move end.

        function startInteract() {
          LOG && console.log("saItemView startInteract");

          var modelID = that["model"].get("_id");

          if (!interactBusy || modelID != interactBusyID) {
            interactBusy = true;
            interactBusyID = modelID;

            // prevent layer to be draggable when a box is highlighted.
            //var layer = that.options.layer;
            var layer = that.boxgroup.getLayer();
            if (layer) {
              layer.setDraggable(false);
              if (that.shoptext) that.shoptext.show();

              // on interaction the item must be on top layer - note: this is basically a hack which can cause issues when item is moved between layers during interaction!
              if (!that.normalZindex) {
                that.normalZindex = layer.getZIndex();
                if (that.normalZindex != 0) {
                  layer.moveToTop();
                }

                // if someone moved me to top layer already - forget about remembering normal z index.
                var newZindex = layer.getZIndex();
                if (newZindex == that.normalZindex) {
                  that.normalZindex = undefined;
                }
              }

              // visualize that item is 'highlighted'
              if (that.brandbox) {
                if (that.brandbox.setFilterRadius) {
                  that.brandbox.setFilterRadius(0);
                }
                else {
                  that.brandbox.setOpacity(0.5);
                }
              }

              if (that["model"].get("status") === saItemView.status.closed) {
                //todo:
                //box.setImage( = imageobjects.selected;
                //brandbox.setImage( = getBrandImage(boxgroup.brandID).reverse;
              }

              //LOG && console.log("trigger startInteract");
              //that.options.viewEvent.trigger("startInteract");

              that.boxgroup.moveToTop();

              layer.draw();

              if (!touchDevice) {

                // css changes triggered by startInteract may revert the cursor change - workaround in firefox to use delay
                function makeCursorPointer() {
                  // if im still alive:
                  if (that["model"]) {
                    //$('#divgridCanvas').css('cursor', 'pointer');
                    divgridCanvas.css('cursor', 'pointer');
                    LOG && console.log("makeCursorPointer");
                  }
                }
                setTimeout(makeCursorPointer, 100);

                //$('#divgridCanvas').css('cursor', 'pointer');
                divgridCanvas.css('cursor', 'pointer');

                //saLayers.disableDragging();

                //document.body.style.cursor = "pointer";
              }
            }
          }
        }

        function endInteract() {
          LOG && console.log("saItemView endInteract");

          var model = that["model"];

          // model may be deleted as result of interact
          if (model) {
            var modelID = that["model"].get("_id");
            if (modelID == interactBusyID) {
              interactBusy = false;
              //interactBusyID = -1;
            }

            //var layer = that.options.layer;
            var layer = that.boxgroup.getLayer();
            if (layer) {

              // restore original layer zIndex
              if (that.normalZindex) {
                if (that.normalZindex != layer.getZIndex()) {
                  layer.setZIndex(that.normalZindex);
                }
                that.normalZindex = undefined;
              }

              if (that.brandbox) {
                if (that.brandbox.setFilterRadius) {

                  // note: would be nice to use tween transition to fade out the effect!
                  /*var tween = new Kinetic.Tween({
                    node: that.brandbox,
                    duration: 1,
                    filterRadius: 255,
                    easing: Kinetic.Easings.EaseInOut
                  }).play();*/

                  that.brandbox.setFilterRadius(255);
                }
                else {
                  that.brandbox.setOpacity(1);
                }
              }
              if (that.shoptext) that.shoptext.hide();

              if (model.get("status") !== saItemView.status.open) {
                if (dragging === false && !interactBusy) {
                  layer.setDraggable(true);
                }
                //todo:
                //box.setImage( =  imageobjects.front;
                //brandbox.setImage( = getBrandImage(boxgroup.brandID).front;
              }
              if (!touchDevice) {

                if (!interactBusy) {
                  // css changes triggered by startInteract may revert the cursor change - workaround in firefox to use delay
                  /*function makeCursorDefault() {
                    LOG && console.log("makeCursorDefault");
                    $('#divgridCanvas').css('cursor', 'default');
                  }
                  setTimeout(makeCursorDefault, 100);
                  */
                  //$('#divgridCanvas').css('cursor', 'default');
                  divgridCanvas.css('cursor', 'default');
                  //saLayers.enableDragging();

                }
                //
                //document.body.style.cursor = "default";
              }

              //LOG && console.log("trigger endInteract");
              //that.options.viewEvent.trigger("endInteract");

              layer.draw();
            }
          }
        }

        function handleClick() {
          LOGM && console.log("itemView handleClick");
          // only handle clicks if nothing is moving
          var layer = that.options.layer; // layer might have changed

          if (!boxgroup.isMoving && layer.getX() === 0 && saItemView.bgAnim.duration === 0) {

            that.toggleOpenClose();
          }

          endInteract();
          boxgroup.isMoving = false;
        }

        // todo: check / make handleClick public for boxgroup
        boxgroup.handleClick = handleClick;


        var endInteractTimer = null;

        this.activeArea.on("mouseover", function() {

          LOG && console.log("activearea mouseover");
          if (endInteractTimer) {
            clearTimeout(endInteractTimer);
            endInteractTimer = null;
          }
          startInteract();
        });

        this.activeArea.on("mouseout", function() {

          LOG && console.log("activearea mouseout");

          // due to css changes a false mouseout might be triggered - to workaround filter mouseout
          function triggerEndInteract() {
            // am I still alive? (i could have been removed from view..)
            if (that["model"]) {
              endInteract();
            }
            endInteractTimer = null;
          }
          if (!endInteractTimer) {
            endInteractTimer = setTimeout(triggerEndInteract, 100);
          }

        });

        // workaround to prevent detecting drag event as click:
        // singleClick <-- reaching value 2 - if this click event range comprises a drag - singleClick was reset to 0 and doesnt reach 2
        var singleClick = 0;

        boxgroup.on("mousedown", function() {
          LOG && console.log("mousedown");
          singleClick = 1;
        });
        boxgroup.on("mouseup", function() {
          LOG && console.log("mousedown");
          singleClick++;
        });

        boxgroup.on("click", function() {
          LOG && console.log("boxgroup click: ",singleClick);
          // touch click is detected by touchend while no movement (dragging) occurred.
          if (!touchDevice && singleClick == 2) {
            handleClick();
          }
        });

        boxgroup.on("touchend", function () {
          LOG && console.log("touchend");
          if (!dragging) {
            handleClick(); // maybe this signals a click..
          }
        });

        boxgroup.on("touchstart", function() {
          touchDevice = true; // flag to prevent responding to redundant mouse events
          boxgroup.isMoving = false;
          startInteract();
        });

        boxgroup.on("touchmove", function() {

        });


        // use activeArea seems not to work on the iPad -> use boxgroup instead.
        boxgroup.on("dragstart", function () {
          LOG && console.log("boxgroup dragstart");
          dragging = true;
          singleClick = 0;

          // remove old dragtouch
          that["model"].set({'touchedElement':null},{'silent':true});

          var layer = that.options.layer;
          layer.setDraggable(false);
          //layer.moveToTop();

          if (touchDevice) {
            boxgroup.isMoving = true;
          }

          LOG && console.log("trigger startDrag");
          that.options.viewEvent.trigger("startDrag");
        });

        boxgroup.on("dragmove", function () {

          var bZ = boxgroup.getZIndex();
          if (bZ != 0) {
            boxgroup.moveToTop();
          }

          if (saInterectAvailable) {
            saIntersect.dragmove(boxgroup, that._callBackOnTouch, that);
          }

          // while moving - can be used to check if envelope is moved to certain pos..
          var pos = boxgroup.getPosition();
          var size = stage.getSize();

          function startTimer(direction) {
            if (that.id2) {
              clearTimeout(that.id2);
            }

            // todo: define functione - not dynamic create it
            that.id2 = setTimeout(function() {
              if (dragging === true) {
                //var moved = modelView.view['moveToLayer'].apply( modelView.view, [ layer ]);

                // mouseout
                //boxgroup.simulate.apply(boxgroup, ['touchend']);
                //dragging = false;
                LOG && console.log(" MOVE IT ",that.options.viewEvent);

                silentPosUpdate();
                if (direction === 'left') {
                  that.options.viewEvent.trigger("moveLayerDown");
                }
                else if (direction === 'right') {
                  that.options.viewEvent.trigger("moveLayerUp");
                }
              }

              clearTimeout(that.id2);
              that.id2 = null;
            }, 600); // msec
          }

          if (pos.x < -20) {
            // move left
            //if (touchDevice) {
            startTimer('left');
            //}
          }
          else if (200 + pos.x - size.width > 40 ) { // there is some pixels more white space at right end, hence
            // move right
            //if (touchDevice) {
            startTimer('right');
            //}
          }
          else if (that.id2) {
            clearTimeout(that.id2);
            that.id2 = null;
          }


          if (saLayers.scrollPageVerticalIfNeeded) {
            saLayers.scrollPageVerticalIfNeeded(pos.y, pos.y + that.activeArea.getHeight());
          }

          //var mousePos = stage.getMousePosition();

          /*var bottomY = pos.y + boxgroup.getHeight();
          var topY = pos.y;

          // is the boxgroup dragged above top or bottom of window?
          if (bottomY >= boxgroup.getLayer().getHeight()) {
            LOG && console.log("dragdown");
          }
          else if (topY <= 0) {
            LOG && console.log("dragup");
          }*/

        });

        function silentPosUpdate() {
          // update my 'model' to reflect current position
          var pos = that.boxgroup.getPosition();
          that["model"].set({'position' : pos}, {'silent':true});
        }

        boxgroup.on("mouseout", function() {
          LOG && console.log("boxgroup mouseout");
          if (dragging === true) {
            var pos = boxgroup.getPosition();
            var size = stage.getSize();
            var mousePos = stage.getMousePosition();
            var toRightEdge = size.width - mousePos.x;

            LOG && console.log(" boxgroup pos is.. ",pos.x,",",pos.y,"  mouse pos is ",mousePos.x,",",mousePos.y,"  otherone: ",toRightEdge);

            if (toRightEdge < 10 || pos.x > (size.width - 200)) {
              LOG && console.log("  to right!");
              silentPosUpdate();
              that.mouseoutDrag = true;
              that.options.viewEvent.trigger("moveLayerUp");
              if (!touchDevice) {
                dragging = false;
              }
            }
            if (mousePos.x < 10 || pos.x < 0) {
              LOG && console.log("  to left!");
              silentPosUpdate();
              that.mouseoutDrag = true;
              that.options.viewEvent.trigger("moveLayerDown");
              if (!touchDevice) {
                dragging = false;
              }
            }
          }
        });

        boxgroup.on("dragend", function () {
          LOG && console.log("sivdragend");
          if (dragging === true && !boxgroup.isDragging()) { //} && that.id2 === null) {
            dragging = false;
            silentPosUpdate();
            var pos = boxgroup.getPosition();
            // signal dragged to listeners
            that.options.viewEvent.trigger("dragged", pos);
          }
          that.options.layer.setDraggable(true);

          LOG && console.log("trigger endDrag");
          that.options.viewEvent.trigger("endDrag");
        });

        if (touchDevice) {
          this.options.layer.simulate('click');
        }

      }
    },

    /**
     * following items need to be available:
     *  this.activeArea
     *  this.boxgroup
     *
     * @param x
     * @param y
     * @param width
     * @param height
     */
    createBrandbox: function(x, y, width, height) {

      var that = this;
      var model = this["model"];

      // correct brandImage will be set in setBrandBoxDimension
      var brandbox = null;

      if (!model.get('noLogo')) {
        var shop = model.get("shop");
        var brandImage = my.getBrandImageModel(shop);
        var brandImageAvailable = brandImage.get("loaded");

        var img;
        if (brandImageAvailable) {
          img = brandImage.get('image');
        }
        else {
          img = saBrandImages.getByName("hourglass");
        }

        var imageConfig = {
          'image': img,
          'x':x, 'y':y,
          'filter': _grayContrastFilter,
          'filterRadius':255  // functions as switch to enable/disable filter
        };

        brandbox = new Kinetic.Image(imageConfig, "brandbox");

        brandbox.setOpacity(1);

        // note: if brandImage is not available, the hourglass is scaled based on the brandImage dimensions, this may lead to various size hourglasses - not what we want.
        if (brandImageAvailable) {
          saImage.positionAndScaleImage(brandbox, brandImage, {x:x, y:y}, width, height); // 160x108
        }

        that.boxgroup.add(brandbox);

        this.brandbox = brandbox;

        // bind change, e.g. caused by image src finished loading, to redraw
        brandImage.bind("change", function () {

          var img = brandImage.get('image');

          if (brandImage.hasChanged('loaded') && that.boxgroup) {
            LOG && console.log(" brandImage loaded: ", brandImage.get("name"), " widht:", brandImage.get('width'), " height:", brandImage.get('height'));

            //todo: changed on 16may to not use two images (one b&w and one color) but to using one and applying filter yes or not. Maybe this is slower?!

            var imageConfig = {
              'image':img,
              'x':x, 'y':y,
              'hide':true,
              'filter':_grayContrastFilter,
              'filterRadius':255
            };

            // replace original image with the now loaded brandImage
            var z = that.brandbox.getZIndex();
            that.brandbox.remove();
            that.brandbox.destroy();

            that.brandbox = new Kinetic.Image(imageConfig, "brandbox");

            saImage.positionAndScaleImage(that.brandbox, brandImage, {x:x, y:y}, width, height);

            that.boxgroup.add(that.brandbox);
            that.brandbox.setZIndex(z);

            that.brandbox.show();

            // brandbox might not be added to a group or layer yet..
            var layer;
            try {
              layer = brandbox.getLayer();
            }
            catch (err) {
              layer = null;
            }
            if (layer && layer.isVisible()) {
              layer.draw();
            }
          }
        }, this);
      }
    },

    // called when boxgroup is intersecting with another element on screen.
    _callBackOnTouch: function(element) {

      var model = this["model"];
      if (model) {
        var lastElement = model.get('touchedElement');

        if (element !== lastElement) {
          this["model"].set({'touchedElement':element},{'silent':true});

          //if (element) {
          //LOGI && console.log(" pcView noticed dragtouch: ",id);
          //}

          if (this.options.viewEvent) this.options.viewEvent.trigger("dragtouch",element,lastElement, this);
        }
      }
    },

    applyTween: function(transconfig) {
      // take into account a 'tween' animation may be busy, if so it gets updated by the newconfig
      var that = this;
      if (that.tween) {

        LOGM && console.log("update tween from:",that.tweenConfig," with new:",transconfig);

        //var oldconfig = $(that.trans.config).clone(false);
        var oldconfig = $.extend({}, that.tweenConfig); //that.trans['config']);

        transconfig = $.extend(oldconfig, transconfig);

        LOGM && console.log("to new config:",transconfig);

        //todo: check if tween get properly killed and detached - no mem leek
        LOGM && console.log("destroy tween -> todo:validate");
        that.tween.pause();
        that.tween.destroy();
        that.tween = null;
      }

      // start the transition for position and opacity
      if (that.boxgroup) {
        that.tween = new Kinetic.Tween(transconfig);
        that.tweenConfig = transconfig;
        that.tween.play();
      }
    },

    'moveToLayer' : function (targetLayer) {
      LOG && console.log("siv movetolayer ",targetLayer.layerIndex," for item:",this['model'].get('name'));
      var currentLayer = this.options.layer;
      var moved = false;
      if (currentLayer.layerIndex !== targetLayer.layerIndex) {
        this.boxgroup.moveTo(targetLayer);
        this.boxgroup.moveToTop();
        this.options.layer = targetLayer;

        // immediate shrink!
        var children = this.boxgroup.getChildren();

        // determine width (alternative width/height info could come from the model)
        var width = 0;
        var height = 0;
        _.each(children, function(child) {
          var w = child.getWidth();
          var h = child.getHeight();
          if (w > width) {
            width = w;
          }
          if (h > height) {
            height = h;
          }
        });

        var pos = this['model'].get("position");

        // ---- animate in, growing from scale 0 to full scale ----
        this.boxgroup.setScale(0, 0);
        //var currentPos = this.boxgroup.getPosition();
        this.boxgroup.setPosition(pos.x + width/2, pos.y + height/2);

        targetLayer.draw();

        new Kinetic.Tween({
          'node': this.boxgroup,
          'x': pos.x,
          'y': pos.y,
          'scaleX': 1,
          'scaleY': 1,
          'duration': 0.5,
          'easing': Kinetic.Easings['StrongEaseOut'],
          'onFinish': function() {
              LOG && console.log("moved in anim done");
          }
        }).play();



        moved = true;
      }
      return moved;
    },

    'update' : function() {
      LOG && console.log("siv update ",this["model"].get("_id"));
      var that = this;
      if (this.options.layer) {

        if (this["model"].hasChanged("position")) {
          // desired position
          var pos = this["model"].get("position");
          // actual position
          var current_pos = this.boxgroup.getPosition();

          // Check targetPos (prev. set destination), current (actual) position and desired position. To determine if a position update is needed.
          if (!this.targetPos || pos.x !== this.targetPos.x || pos.y !== this.targetPos.y || pos.x !== current_pos.x || pos.y !== current_pos.y) {

            LOG && console.log("saItemView newPos:",pos.x,",",pos.y,"  currentpos:",current_pos.x,",",current_pos,"  id",this["model"].get("_id"));
            // prevent interference with user
            if (!this.boxgroup.isDragging() || this.mouseoutDrag) {

              this.targetPos = {x: pos.x, y: pos.y};
              this.mouseoutDrag = false;
              this.boxgroup.moveToTop();

              // should next position update be a direct setPosition or a transition animation
              var directPosition = !this["model"].get("animateNextMove");
              var notVisible = !this.options.layer.isVisible();

              if (directPosition || notVisible) {
                LOG && console.log("setPosition ",pos.x,",",pos.y,"  dp:",directPosition," nv:",notVisible," id:",this["model"].get("_id"));
                this.boxgroup.setPosition(pos);
                this.boxgroup.setOpacity(this["model"].get("opacity"));
                if (directPosition) {
                  // restore default
                  this["model"].set({'animateNextMove':true},{'silent':true});
                }
              }
              else {
                // wait a while before starting the transition, there may be multiple reposition requests in short time
                // only the last one will be honored, or depending on timing two transitions may happen right after each other.
                if (!that.id5) {
                  var waitBeforeTransTime = 100; //msec
                  // if a trans is already busy, it will be replaced by this new one

                  // info: http://www.makemineatriple.com/2007/10/passing-parameters-to-a-function-called-with-settimeout
                  function _startTransTimeout() {
                    // todo: define functione(e) - not dynamic create it
                    that.id5 = setTimeout(function(that) {
                      var model = that["model"];

                      clearTimeout(that.id5);
                      that.id5 = null;

                      if (model) {
                        var pos = model.get("position");

                        var transconfig = {
                          'node': that.boxgroup,
                          'x': pos.x,
                          'y': pos.y,
                          'duration': 0.5,
                          //'scaleX':1,
                          //'scaleY':1,
                          'opacity': model.get("opacity"),
                          'rotation': 0,
                          'onFinish': function() {
                            // transition is completed, remove it and reset
                            that.tween = null;

                            // check if we are at our set Position, if not trigger another trans
                            if (that.boxgroup) {
                              var current_pos = that.boxgroup.getPosition();
                              var model = that["model"];
                              if (model) {
                                var pos = model.get("position");
                                if (pos.x !== current_pos.x || pos.y !== current_pos.y) {
                                  LOG && console.log(" update: ahoh, were not there yet..");
                                  _startTransTimeout();
                                }
                              }
                            }
                          }
                        }

                        that.applyTween(transconfig);
                      }
                    }, waitBeforeTransTime, that); // msec
                  }

                  _startTransTimeout();
                }
              }
            }
          }
        }

        if (this["model"].hasChanged("opacity")) {
          var opacity = this["model"].get("opacity");
          this.boxgroup.setOpacity(opacity);
        }

        var layer = this.options.layer;
        if (layer.isVisible()) {
          layer.draw();
        }
      }
    },

    'remove': function() {
      // note: remove is can be called by backbone lib
      LOG && console.log(" remove called");
      if (saInterectAvailable) {
        var model = this["model"];
        if (model) {
          // signal lost touch if a touch was active - so parent can clean up
          var lastElement = model.get('touchedElement');

          if (lastElement) {
            model.set({'touchedElement':null},{'silent':true});
            LOG && console.log("signal lost touch!");
            if (this.options.viewEvent) this.options.viewEvent.trigger("dragtouch",null,lastElement, this);
          }
        }
        else {
          LOG && console.log(" remove called while model is already gone..");
        }
      }
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

      this.constructor['__super__'][funcName].apply(this, _.rest(arguments));

      // if using abbreviated method names, they need to be translated:
      /*
      // translate from text name to functionCall (needed for compatibility with google closure compiler)
      var that = this;
      switch(funcName) {
        case "update": return that.constructor['__super__'].update.apply(that, _.rest(arguments)); break;
        default:
          throw "saItemView: Unknown funcname at _super:"+funcName;
      }
      */
    }

  });

  //*********** view data ***********************
  //enum - for envelope status
  my.status = {
    open : 1,
    opening : 2,
    closed : 3,
    closing : 4
  };

  my.bgAnim = {
    step : 0,
    delta : 1,
    duration : 0
  };

  /*
   * create a triangle shape by defining a
   * drawing function which draws a triangle
   */
  my.genTriangle = function(tWidth, basePos, optColor) {
          if (!optColor) {
            optColor = "#FFF";
          }
          var triangle = new Kinetic.Shape({
            drawFunc: function(canvas) {
              var context = canvas.getContext();
              context.save();
              //
              //          .     <-- height = 1/3 width
              //         . .
              //       .     .
              //     ...........   <-- tWidth
              //          L base pos
              //
              var curve = 12;

              context.beginPath();
              context.moveTo(basePos.x - tWidth/2, basePos.y);
              context.quadraticCurveTo(basePos.x - tWidth/(curve), basePos.y - tWidth/(curve*2), basePos.x, basePos.y - tWidth/3);
              context.quadraticCurveTo(basePos.x + tWidth/(curve), basePos.y - tWidth/(curve*2), basePos.x + tWidth/2, basePos.y);
              context.lineTo(basePos.x - tWidth/2, basePos.y);
              context.closePath();

              canvas['fillStroke'](this);
              //context.fill();
              //context.stroke();
              context.restore();
            },
            'fill': optColor
            // use a white shadow upwards, to ensure contrast on dark background - that the triange tip is visible
            /*'shadow': {
              'color': '#FFFFFF',
              'blur': 6,
              'offset': [0, -4],
              'alpha': 0.5
            }*/
            //stroke: "#000000",
            //strokeWidth: 4
          });
          return triangle;
  };

  my.getBrandImageModel = function(shop) {
    var brandImage = _.find(saBrandImages["models"], function (image) {
      return image.get("name") === shop;
    });

    if (!brandImage) {
      brandImage = saImage.initImage(saBrandImages, shop, "./img/s/" + shop + ".jpg");
    }
    return brandImage;
  };

  // from: http://jsperf.com/nativememoryoperations-memcpy-test
  function typedArraySetMemcpy(dest, destOffset, src, srcOffset, countBytes) {
    try {
      destOffset = ((destOffset * dest.BYTES_PER_ELEMENT) + dest.byteOffset) | 0;
      srcOffset = ((srcOffset * src.BYTES_PER_ELEMENT) + src.byteOffset) | 0;

      var destBytes = new Uint8Array(dest.buffer, 0, dest.byteLength);
      var srcBytes = new Uint8Array(src.buffer, srcOffset, countBytes);

      destBytes.set(srcBytes, destOffset);
    }
    catch(e){
      // for internet explorer 10, it wont be able to use src.buffer
      typedArraySetMemcpy = function(dest, destOffset, src, srcOffset, countBytes) {
        // ignoring offset
        for (var n= 0; n < countBytes; n++) {
          dest[n] = src[n];
        }
      }
    }
  }

  // see Kinetic.Filters.Grayscale
  //_grayContrastFilter = Kinetic.Filters.Grayscale;

  // modified Grayscale filter, which uses filterRadius as a switch to filter yes or no.
  var _grayContrastFilter = function(imageData) {
    var data = imageData.data;
    var radius = this.getFilterRadius() | 0;
    var MAX_RADIUS = 255;
    /*
     If i dont backup the image data, it seems the old image data from before applying the filter is available,
     but its not - the quality of the image data degrades after each filter session.
     At this moment I dont understand why the image data would degrade.
     So the workaround is to backup the initial filter data -> potential issue: if applyFilter is called before valid data is available - we get stuck with the invalid data in the backup..
     You can try it out by disabling the backupImageData and then in the app mouseover & out one item - to toggle color<->bw vice versa multiple times.
     */
    if (radius > 0) {
      if (radius > MAX_RADIUS) {
        radius = MAX_RADIUS;
      }
      var backupImageData = null;

      if (!this['backupImageData']) {
        backupImageData = this['backupImageData'] = new Uint8Array(data.length); //new Array(data.length);

        // note: source data may be of standard/other type -> this may not work ok... always (e.g. in IE10)
        typedArraySetMemcpy(backupImageData, 0, data, 0, data.length);
      }

      for(var i = 0; i < data.length; i += 4) {

        var src = data;
        if (this['backupImageData']) {
          src = this['backupImageData'];
        }

        /*
         * note rgbToHsv -> you can adjust Saturation to get a gradual change to grayscale, to use with a tween animation for example
         *
         * problem is with semi opacity, if alpha is between 0 and 255 -> the filtered values will be drawn cumulative
         * this results that the semi opacity values get drawn on top of each other -> gives a very bad image
         *
         * solution: convert all images to have binary alpha (e.g. set the background to white and then put a binary filter on opacity)
         *
         * solution2: in sw -> calculate the color as background would be white (255,255,255), then set the opacity to 255 for this new color
         *   this doesnt work.
         *   tried with doing it straight on rgb values, on hsv values - tweaking the 'V' and on hsl values - tweaking the 'l'
         *
         * rgbToHsv, adjust the saturation, hsvToRgb  -> gives best gradual grayscale results
         * rgbToHsl, adjust luminosity, hslToRgb -> should give best result in converting semi transparancy to full opacity.
         *
         */

        /*if (src[i+3] > 0) {
          var r = src[i];
          var g = src[i+1];
          var b = src[i+2];

          var alpha = src[i+3];

          //r = (((r * alpha) + (255 - alpha)*255) / 255)|0;
          //g = (((g * alpha) + (255 - alpha)*255) / 255)|0;
          //b = (((b * alpha) + (255 - alpha)*255) / 255)|0;

          var hsl = saImage.rgbToHsl(r,g,b);

          hsl[1] = (hsl[1] * (255-radius)/255)|0;

          hsl[2] = (((hsl[2] * alpha) + (255 - alpha)*255) / 255)|0;

          var rgb = saImage.hslToRgb(hsl[0],hsl[1],hsl[2]);

          data[i] = rgb[0];
          data[i+1] = rgb[1];
          data[i+2] = rgb[2];
          data[i+3] = 255;
        }*/

        var brightness = ((0.34 * src[i] + 0.5 * src[i + 1] + 0.16 * src[i + 2]))|0;

        // red
        data[i] = brightness;
        // green
        data[i + 1] = brightness;
        // blue
        data[i + 2] = brightness;
      }
    }
    else if (this['backupImageData']) {
      var sourceImageData = this['backupImageData'];
      var l = sourceImageData.length;

      typedArraySetMemcpy(data, 0, sourceImageData, 0, l);
      /*for(var i = 0; i < l; i ++) {
        data[i] = sourceImageData[i];
      }*/
    }
  }

  return my;
})();

