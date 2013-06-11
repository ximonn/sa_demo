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
 *
 * collection of layers, at least one, more depending on how many GridItems there are to display.
 */

var saLayers = (function () {
  var stack = [];
  var activeLayer = 0;
  var lsAnimation = null;
  var my = {};
  var touchDevice = false;
  var stage = {}; // kinetics stage
  var stageDoc = null; // optional stage for dragging
  var screen = {}; // screen 'model'
  var layerEvent;
  var screenPos = {};
  var dragging = false;
  var bgAnim = {
      step : 0,
      delta : 1,
      duration : 0
  };

  my.resized = function() {

    var stageWidth = $('#divgridCanvas').width();

    var canvasHeight = $('#divgridCanvas').height();

    if (!stage.canvasIsFullPage) {
      my.gridHeight = canvasHeight;
    }
    else {
      //todo: determine in a different way what the gridHeight should be
      // for now not too important, as we have a fixed gridHeight..
    }

    stage.setSize( stageWidth, my.gridHeight);
  }

  /** initDynamicStageHeight
   *
   * @param params - expected params: gridTop, gridHeight, pageHeight
   */
  my.initDynamicStageHeight = function(params) {

    //note: instead of dynamic changing the canvas, to let mouse events reach the 'other' html elements
    //      we could set css pointer-events for #divgrid to none, to let mouse events (mouse over, click) go to whats beneath:
    //      http://caniuse.com/#search=pointer-event

    my.gridTop = params.gridTop;
    my.gridHeight = params.gridHeight;
    my.pageHeight = params.pageHeight;

    LOG && console.log("initDynamicStageHeight gridTop:",my.gridTop, "gridHeight:",my.gridHeight," pageHeight:",my.pageHeight);

    var scrollUpTimeout = null;
    var scrollDownTimeout = null;
    var scrollDelay = 200;
    var scrollContinueDelay = 100;
    var initialScrollStep = 10;
    var scrollStep = initialScrollStep;
    var maxScrollStep = 100;
    my.continueScroll = false;

    my.scrollPageVerticalIfNeeded = function(yPosTop, yPosBottom) {

      //var height = $(window).height();
      var scrollTop = $(window).scrollTop();
      var scrollBottom = scrollTop + $(window).height();

      var itemTop = yPosTop + my.gridTop;
      var itemBottom = yPosBottom + my.gridTop;

      if (itemTop < scrollTop) {
        LOG && console.log("scroll up!");

        function scrollUp() {
          //$("#divgrid").scrollTop($("#divgrid").scrollTop() - 1);
          scrollTop -= scrollStep;
          scrollStep *= 1.2;
          if (scrollStep > maxScrollStep) scrollStep = maxScrollStep;
          $("html, body").animate({ scrollTop: scrollTop  }, scrollContinueDelay - 10);
          if (my.continueScroll) scrollUpTimeout = setTimeout(function(){
            scrollUp();
          }, scrollContinueDelay);
        }

        if (!scrollUpTimeout) {
          scrollUpTimeout = setTimeout(function(){
            scrollUp();
          },scrollDelay);
        }

        my.continueScroll = true;
      }
      else if (itemBottom > scrollBottom) {
        LOG && console.log("scroll down!");

        function scrollDown() {
          //$("#divgrid").scrollTop($("#divgrid").scrollTop() + 1);
          scrollTop += scrollStep;
          scrollStep *= 1.2;
          if (scrollStep > maxScrollStep) scrollStep = maxScrollStep;
          $("html, body").animate({ scrollTop: scrollTop }, scrollContinueDelay - 10);
          if (my.continueScroll) scrollDownTimeout = setTimeout(function(){
            scrollDown();
          }, scrollContinueDelay);
        }

        if (!scrollDownTimeout) {
          scrollDownTimeout = setTimeout(function(){
            scrollDown();
          },scrollDelay);
        }

        my.continueScroll = true;
      }
      else {
        if (scrollUpTimeout) {
          clearTimeout(scrollUpTimeout);
          scrollUpTimeout = null;
        }
        if (scrollDownTimeout) {
          clearTimeout(scrollDownTimeout);
          scrollDownTimeout = null;
        }
        my.continueScroll = false;
        scrollStep = initialScrollStep;
      }
    }

    function _setStageFullPageHeight(shape) {
      var layer = shape.getLayer();
      var xpos = layer.getPosition().x;

      // are we waiting to undo "stage full page height"? if so stop that
      if (resetStageTimer) {
        LOG && console.log(" clearing _resetStageHeight timer, we remain full page!");
        clearTimeout(resetStageTimer);
        resetStageTimer = null;
      }

      if (!stage.canvasIsFullPage /*&& bgAnim.duration == 0 && xpos == 0*/) { // <- its not an issue if an animation is going on..!
        LOG && console.log("_setCanvasFullPageHeight");
        $('#divgridCanvas').css("top", -my.gridTop);
        $('#divgridCanvas').css("height", my.pageHeight);

        var layers = stage.getChildren();
        _.each(layers, function(layer) {layer.setPosition(0, my.gridTop)});
        shape.getStage().setHeight(my.pageHeight);
        stage.canvasIsFullPage = true;
      }
    }

    my.setStageFullPageHeight = _setStageFullPageHeight;

    var resetStageTimer = null;

    function _resetStageHeight(shape) {

      var layers = stage.getChildren();

      if (stage.canvasIsFullPage && !resetStageTimer) {

        // prevent jitter -> stage height being set and reset in a loop - ensure minimum wait time before resetting

        resetStageTimer = setTimeout(function() {

          LOG && console.log("_resetCanvasHeight");
          //$('#divgrid').css("top", my.gridTop);
          $('#divgridCanvas').css("top", 0);
          $('#divgridCanvas').css("height", my.gridHeight);
          _.each(layers, function(layer) {layer.setPosition(0, 0);});

          //shape.getStage().setHeight(my.gridHeight);
          stage.setHeight(my.gridHeight);

          if (shape) {
            var pos = shape.getPosition();

            // ensure object is within range of canvas
            if (pos.y < 0) {
              pos.y = 0;
            }
            var lHeight = my.gridHeight - shape.getHeight();
            if (pos.y >  lHeight) {
              pos.y = lHeight;
            }
            shape.setPosition(pos);

            var layer = shape.getLayer();
            layer.draw();
          }

          stage.canvasIsFullPage = false;

          clearTimeout(resetStageTimer);
          resetStageTimer = null;
        }, 200); // msec
      }
    }

    my.resetStageHeight = _resetStageHeight;
  }


  function setInvisbleSwipeRectSize(invisibleSwipeRect) {
    // done: 54 is the hight of bottombar, 36 is var cspacing (circles) and 8px is to make sure whole circle is clickable.
    //invisibleSwipeRect.setHeight(screenPos.height - screenPos.voffset - 54 - 0 - 6);  //  - 36 - 8
    invisibleSwipeRect.setHeight(screenPos.height);  //  - 36 - 8
    invisibleSwipeRect.setWidth(screenPos.width);
  }

  function screenUpdate() {
    var newScreenPos = screen.get('position');

    LOG && console.log(" old:",screenPos.width,",",screenPos.height," new:",newScreenPos.width,",",newScreenPos.height);
    // screen size changed?
    if (newScreenPos.width != screenPos.width || newScreenPos.height != screenPos.height) {
      screenPos = newScreenPos;
      LOG && console.log(" saLayers screenUpdate! ");

      // update invisible swipe rect for all layers.
      var l = stack.length;
      for (var n=0; n < l; n++) {
        var invisibleSwipeRect = _.find(stack[n].getChildren(), function(child) {return child.getName() === 'swipeRect';});
        setInvisbleSwipeRectSize(invisibleSwipeRect);
      }
    }

    // check activeLayer
    var al = screen.get('activeLayer');
    setActiveLayerByIndex(al);
  }
  
  my.initialize = function(theStage, theScreenModel, theLayerEvent) {
    stage = theStage;
    screen = theScreenModel;
    layerEvent = theLayerEvent; // if something funky happens to my layers, trigger events here.
    
    screen.bind('change', screenUpdate, this);
    screenUpdate();
  }


  // drag stage is not needed - we just resize the main stage instead of moving items to and from a full page stage
  /*my.setDragStage = function(stageDoc, yOffset) {

    var layerDoc = new Kinetic.Layer();
    stageDoc.add(layerDoc);

    var gridLayer = null;

    var Z_grid = 100;
    var Z_container = -100;

    // note, removing a shape from its container and putting it on another container in another stage, doesnt work.
    // so to 'move' the shape from one stage to another: create a clone and throw the old one away
    function prepStageSwap(yOffset, layer, shape, shapeConstructor) {

      // remove all event listners (prevent oscillation)
      shape.off("mouseover mouseout");
      // swap Z-indexes
      var Z_temp = Z_container;
      Z_container = Z_grid;
      Z_grid = Z_temp;

      // first swap z index of containers, bringing the other on top
      $('#container').css("z-index",Z_container);
      $('#divgrid').css("z-index",Z_grid);

      // determine position in new container
      var pos = shape.getPosition();
      pos.y += yOffset;

      // ensure object is within range of canvas
      if (pos.y < 0) {
        pos.y = 0;
      }
      var lHeight = layer.getStage().getHeight() - 20;
      if (pos.y >  lHeight) {
        pos.y = lHeight;
      }

      // remove from old
      shape.remove();

      // overwrite with brand new one on destination layer
      //shape = shape.clone();
      shape = shapeConstructor();
      shape.setPosition(pos.x, pos.y);
      layer.add(shape);
      shape.moveToTop();
      layer.draw();

      return shape;
    }

    var gridLayer = null;

    my.swapToDoc = function(shape, shapeConstructor) {
      LOG && console.log(" swapToDoc");
      gridLayer = shape.getLayer();
      var clone = prepStageSwap(yOffset, layerDoc, shape, shapeConstructor);
      gridLayer.draw(); // refresh old layer
      return clone;
    }

    my.swapToGrid = function(shape, shapeConstructor) {
      LOG && console.log(" swapToGrid");
      var clone = prepStageSwap(-yOffset, gridLayer, shape, shapeConstructor);
      layerDoc.draw(); // refresh old layer
      return clone;
    }
  }
  */

  /**
   * dragBoundFunc
   * @param pos
   * @return {*}
   */
  my.applyDragBoundsToBody = function(pos) {
    if (pos.y != 0) {

      if (touchDevice) {
        // apply the layer vertical scrolling to the body
        var body = $('body');
        var position = body.scrollTop();
        var new_position = position - pos.y;
        body.scrollTop(new_position);
      }

      pos.y = 0;
    }

    return pos;
  }

  my.createLayer = function () {
    // default initialization for new layer:
    var newLayer = new Kinetic.Layer({draggable: true});
    newLayer.hide();
    newLayer.layerIndex = stack.length;
    //newLayer.setDragConstraint("horizontal");

    newLayer.setDragBoundFunc(my.applyDragBoundsToBody);

    stage.add(newLayer);
    
    // add swipe rect
    var invisibleSwipeRect = new Kinetic.Rect({
      //'fill': 'green', // for debugging
      'x': 0,
      'y': 0, //screenPos.voffset,
      'name' : 'swipeRect'
    });
    setInvisbleSwipeRectSize(invisibleSwipeRect);

    newLayer.add(invisibleSwipeRect);

    newLayer.on("touchstart", function() {
      touchDevice = true;
    });
    newLayer.on("click", function() { 

      //if (!touchDevice) {
         // my.checkLayerSwipe();
      //}
    });
    newLayer.on("mouseout", function() {
      var mousePos = stage.getMousePosition();

      my.continueScroll = false;

      LOG && console.log(" mouse out! dragging:",dragging);
      if (dragging) {
        my.checkLayerSwipe();
      }
      dragging = false;
    });
    newLayer.on("dragend", function () {
      LOG && console.log(" dragend: ",dragging);
      if (dragging) {
        my.checkLayerSwipe();
      }
      dragging = false;
    });
    newLayer.on("dragstart", function () {
      dragging = true;

      LOG && console.log(" dragstart");

      if (bgAnim.duration !== 0) {
        // during anim draggable seems disabled - todo: support layer swipe while swipe is active (e.g. go left and back right before left is finished)
        TLOG && console.log(" HAAAAA dragging starts while in layer anim");

        // make sure no anmi is going on
        _stop_animate_layer_swap();

        bgAnim.duration = 0;
      }

      // bring divgrid back - this is not full proof - if the reset event came but the browser didnt change the grid yet and you just trigger the drag,
      //  you can get the effect of the whole grid being out of position. Though you must go for it to get that effect.
      //  layer.y may be at 0 or at the gridTop offset ~ problem is this dragStart is also called when you drag a box of the grid and not the layer.
      var lPos = newLayer.getPosition();
      if ((lPos.x !== 0 || (lPos.y !== 0 && lPos.y != my.gridTop)) && my.resetStageHeight) {
        LOG && console.log("lPos:",lPos.x,",",lPos.y);
        my.resetStageHeight(newLayer.getChildren()[0]);
        newLayer.draw();
      }

    });
  
    
    stack.push(newLayer);
    return newLayer;
  };
  
  _isLayerSwapBusy = function() {
    return (bgAnim.duration === 0) ? false : true;
  };
  
  setActiveLayerByIndex = function(nr) {
    //if (!_isLayerSwapBusy()) {
      // animate new layer in?
      if (activeLayer !== nr && nr >= 0) {
        dragging = false;
        var oldLayer = activeLayer;

        // check if a layer swap is busy..
        _stop_animate_layer_swap();

        _start_animate_layer_swap(
            my.getLayerByIndex(oldLayer), 
            my.getLayerByIndex(nr));
        
        activeLayer = nr;
      }
      
      
      // update screen 'model'?
      /*if (screen.get("activeLayer") !== nr) {
        //screen.set({'activeLayer': nr});
        layerEvent.trigger("activeLayerChange", nr);
      }*/
   /* }
    else {
      var id2 = setTimeout(function() {
        LOG && console.log("  tryagain to setActiveLayerByIndex(",nr,")");
        dragging = false;
        setActiveLayerByIndex(nr);
        clearTimeout(id2); 
        id2 = null; 
      }, 50); // msec 
    }*/
  };
  
  my.getActiveLayerIndex = function(){
    return activeLayer;
  };
  
  my.getActiveLayer = function() {
    var layer = null;
    if (activeLayer < stack.length && activeLayer >= 0) {
      layer = stack[activeLayer];
      
      // strawalsky logic: if we want it, it need to be shown and draggable
      LOG && console.log("my.getActiveLayer.show!",layer);
      if (!layer.getVisible()) {
        layer.show();
      }
      layer.setDraggable(true);
      LOG && console.log(" show2 ",layer.layerIndex);
    }
    else {
      // todo: throw
      LOG && console.log("ERROR getActiveLayer() activeLayer is out of bounds: ",activeLayer);
    }
    return layer;
  };

  var drawTimeOut = null;
  var drawLayer = null;

  function doDrawLayer() {
    drawTimeOut = null;
    LOG && console.log("my.draw! activeLayer.show");

    if (!drawLayer.getVisible()) {
      drawLayer.show();
    }
    drawLayer.draw();
    LOG && console.log(" show3 ",drawLayer.layerIndex);
  }

  my.draw = function() {
    LOG && console.log("my.draw activeLayer:",activeLayer);
    var layer = stack[activeLayer];

    if (layer) {
      if (drawLayer != layer && drawTimeOut) {
        clearTimeout(drawTimeOut);
        drawTimeOut = null;
      }

      // throttle of layer draws - layer.draw() is most intensive activity
      if (!drawTimeOut) {
        drawLayer = layer;
        drawTimeOut = setTimeout(doDrawLayer, 200);
      }
    }
  };
  
  my.getLastLayer = function() {
    var l = stack.length;
    return stack[l-1];
  };
  
  my.updateNrOfLayers = function (nrOfRequiredLayers) {
    // maintain minimum of one layer
    if (nrOfRequiredLayers < 1) {
      nrOfRequiredLayers = 1;
    }

    if (activeLayer >= nrOfRequiredLayers) {

      var old = activeLayer;
      setActiveLayerByIndex(nrOfRequiredLayers - 1);

      LOG && console.log(" set activeLayerChange:",activeLayer," from old:",old);
      layerEvent.trigger("activeLayerChange", activeLayer);

      //layer = saLayers.getActiveLayer();
      //_start_animate_layer_swap(old_layer, layer);


      //layerEvent.trigger("activeLayerChange", stack.length - 1);
      //my.setActiveLayerByIndex(stack.length - 1);
    }

    var updated = false;
    var nrOfLayers = stack.length;
    var nr = nrOfRequiredLayers - nrOfLayers;
    LOG && console.log("current:",nrOfLayers," required:",nrOfRequiredLayers," addLayers:",nr);
    
    while (nr > 0 && stack.length > 0) {
      my.createLayer();
      updated = true;
      nr--;
    }
    while (nr < 0) {
      // clean up the layer that gets popped
      var layer = stack[stack.length-1];
      //layer.removeChildren();
      //layer.clear(); // clear canvas
      //layer.hide();
      
      stack.pop();
      updated = true;
      nr++;
    }

    return updated;
  };
  
  my.length = function() {
    return stack.length;
  };
  
  my.getLayerByIndex = function(nr) {
    var layer = null;
    if (nr >=0 && nr < stack.length) {
     layer = stack[nr];
    }
    return layer;
  };
  
  function _animate_layer_swap(old_layer, new_layer, frame, enterFromRight) {
    var retval = 0;
    if (frame.time > bgAnim.duration) {
        
        var po = null;
        if (old_layer) {
            po = old_layer.getPosition();
        }
        var pn = new_layer.getPosition();
        
        var midx = (screenPos.width >> 1) | 0; // devide /2;
        
        var diffx;
        
        if (enterFromRight) {
            diffx = midx - pn.x;
        }
        else {
            diffx = midx + pn.x;
        }
         
        if (diffx < 0) {
            diffx = 0;
        }
        diffx = Math.abs(midx - diffx);  // keep it positive
        diffx = diffx >> 3;
        diffx++; // guarantee one pixel
        
        if (enterFromRight) {
            pn.x -= diffx;
            if (po) {
                po.x -= diffx;
            }
            
            if (pn.x < 0) {
                pn.x = 0;
            }
        }
        else {
            pn.x += diffx;
            if (po) {
                po.x += diffx;
            }
            
            if (pn.x > 0) {
                pn.x = 0;
            }
        }
        
        if (po) {
            old_layer.setPosition(po.x, po.y);
            old_layer.draw();
        }
        new_layer.setPosition(pn.x, pn.y);
        new_layer.draw();
        
        bgAnim.duration = frame.time + 15; // msec
        
        if (pn.x === 0) {
            LOG && console.log(" stop layer animation..");
            if (po) {
                old_layer.hide();
            }
            retval = -1; // stop animation

            //new_layer.setDraggable(true);
            bgAnim.duration = 0;
            
            // this is not needed // wake up children
            /*var children = new_layer.getChildren();
            _.each(children, function(child){
              child.setListening(true);
            });*/
            
            // make sure controls can be used and are not covered by invisible rect in other layers.
            //layerControls.moveToTop();
        }
      return retval;
    }
  };

  function _stop_animate_layer_swap() {
    if (lsAnimation) {

      LOG && console.log("  _stop_animate_layer_swap");

      var attr = lsAnimation['saAttrs'];
      var old_layer = attr['oldLayer'];
      var new_layer = attr['newLayer'];



      /*
      // make sure all other layers are hidden
      var l = stack.length;
      for (var n=0; n<l; n++) {
        var layer = stack[n];
        if (n !== activeLayer) {
          LOG && console.log("hide ",n);
          //layer.setPosition({x:2000, y: 0});
          layer.clear();
          layer.hide();
        }
      }
      */

      TLOG && console.log(" oldLayer:",old_layer," newLayer:",new_layer," lsAnim:",lsAnimation);
      // hide old layer
      if (old_layer !== new_layer && old_layer) {
        old_layer.clear();
        old_layer.hide();
      }

      lsAnimation.stop();
      lsAnimation = null;
    }
  }
  
  function _start_animate_layer_swap(old_layer, new_layer) {

    // make sure any previous ongoing anim is stopped
    _stop_animate_layer_swap();

    var giveMomentum = false;
    if (new_layer) {
      giveMomentum = true;
    }

    // valid old layer is needed at minimum
    if (old_layer) {
      if (new_layer && new_layer != old_layer) {
        new_layer.show();

        // make sure newLayer is above old-layer
        var nz = new_layer.getZIndex();
        var oz = old_layer.getZIndex();
        TLOG && console.log(" nz:",nz," oz:",oz);
        if (oz > nz) {
          if (new_layer['parent']) {
            new_layer.setZIndex(oz);
            TLOG && console.log("  set nz to:",oz);
          }
          else {
            console.log("warning [saLayers]: trying to set newlayer z-index while it has no parent.");
          }
        }
      }
      else {
        // we're just animating the current 'old_layer' to its position, no new_layer
        //old_layer.setDraggable(false);
        new_layer = old_layer;
        old_layer = null;
      }

      // Its not needed to shut up children:  // shut up children during grand layer swap
      /*var children = new_layer.getChildren();
      _.each(children, function(child){
        child.setListening(false);
      });
      */
      
      var pn = new_layer.getPosition();
      
      var enterFromRight;
      
      if (old_layer) {
          
          var oldLayer = old_layer.layerIndex;
          var activeLayer = new_layer.layerIndex;
          
          if (oldLayer > activeLayer) {
              enterFromRight = false;
              pn.x = -screenPos.width;
          }
          else {
              enterFromRight = true;
              pn.x = screenPos.width;
          }
      }
      else {
        // give some initial 'motion' to the move..
          if (pn.x > 0) {
            enterFromRight = true;
            if (giveMomentum) pn.x += screenPos.xstep;
          }
          else {
            enterFromRight = false;
            if (giveMomentum) pn.x -= screenPos.xstep;
          }
      }
      
      LOG && console.log(" startAnimate newLayer pos.x ",pn.x," enterFromRight: ",enterFromRight);
      
      new_layer.setPosition(pn.x,pn.y);
      
      bgAnim.duration = 0.1;


      // animate layer swap
      /*lsAnimation = new Kinetic.Animation({
        'func': function(frame) {
          var result = _animate_layer_swap(old_layer, new_layer, frame, enterFromRight);
          if (result === -1) {
            _stop_animate_layer_swap();
          }
        }
      });*/
      lsAnimation = new Kinetic.Animation(function(frame) {
          var result = _animate_layer_swap(old_layer, new_layer, frame, enterFromRight);
          if (result === -1) {
            _stop_animate_layer_swap();
          }
      });
      lsAnimation['saAttrs'] = {'oldLayer':old_layer, 'newLayer':new_layer};
      lsAnimation.start();
    }
  };
  
  
  
  my.checkLayerSwipe = function() {
    // touch click is detected by touchend while no movement (dragging) occurred.
    
    var layer = stack[activeLayer];;
  /*  var mousePos = stage.getMousePosition();
    if (mousePos) {
        var x = mousePos.x;
        var y = mousePos.y;
    */    //var activeLayer = saLayers.getActiveLayerIndex();
        var layerpos = layer.getPosition();
        
        var thrashDelta = (screenPos.width / 20) | 0;
        if (layerpos.x > thrashDelta) {
          LOG && console.log("move left");
          var old_layer = layer;
          if (activeLayer > 0) {
            activeLayer--;
            layerEvent.trigger("activeLayerChange", activeLayer);
          }
          layer = saLayers.getActiveLayer();
          _start_animate_layer_swap(old_layer, layer);
        }
        else if (layerpos.x < -thrashDelta) {
          LOG && console.log("move right");
          var old_layer = layer;
          if (activeLayer < saLayers.length() - 1) {
            activeLayer++;
            layerEvent.trigger("activeLayerChange", activeLayer);
          }
          layer = saLayers.getActiveLayer();
          _start_animate_layer_swap(old_layer, layer);
        }
        else {
          LOG && console.log(" no swipe ");
          if (layerpos.x != 0) {
            _start_animate_layer_swap(layer, null);
          }
        }
   /* }
    else {
      LOG && console.log("checkLayerSwipe: no mouse pos ");
    }*/
  };

  my.setDirty = function(bDirty) {
    if (bDirty === undefined) {
      my._saDirty = true;
    }
    else if (bDirty) {
      my._saDirty = true;
    }
    else {
      my._saDirty = false;
    }
  }

  my.getDirty = function() {
    return my._saDirty;
  }

  // hide all layers
  my.hide = function() {
    // note: its expected that all layers by activeLayer are already hidden
    //       nevertheless, lets just trigger hide for all.
    _.each(stack, function(layer) {
      layer.hide();
    });
  };

  return my;
}());
