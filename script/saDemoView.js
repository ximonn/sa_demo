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
var saDemoView = (function (_id) {
  var my = {};

  var saBrandImages = new saImage.Collection;

  var bufferLayer = new Kinetic.Layer();
  var bufferStage = new Kinetic.Stage({
    'container' : 'tempdiv', //'divgrid',
    'width' : 200, // $('#divgrid').width(),  //window.innerWidth, //
    'height' : 200 //$('#divgrid').height() //window.innerHeight //
  });
  bufferStage.add(bufferLayer);

  var vWidth = 200;
  var vHeight = 200;

  my.saDemoViewModel = Backbone.Model.extend({
    // Default attributes for the envelopeModel item.
    'defaults' : function() {
      return {
        'name' : "",
        'image' : "envelope_closedback",
        '_id' : "",
        'position' : { x: 0, y: 0},
        'animateNextMove': true,
        'opacity' : 1
      };
    },
    'initialize' : function() {
      var shop = this.get("shop");
      saImage.initImage(saBrandImages, shop, "./img/s/"+shop+".jpg");
    },
    'clear' : function() {
      this.destroy();
    }
  });

  var envelopeViewModelCollection = Backbone.Collection.extend({
    // Reference to this collection's 'model'.
    'model' : my.saDemoViewModel
  });
  my.saDemoViewModelCollection = new envelopeViewModelCollection;

  my.saDemoView = saItemView.extend({

    'initialize' : function() {
      var that = this;
      var layer = this.options.layer;
      var stage = layer.getStage();
      var model = this['model'];

      my.saDemoViewModelCollection.add(model);

      LOG && console.log(" saDemoView this:",this);

      if (model) {
        this["model"].bind('change', function() {
          LOG && console.log("modelChanged");
          this.update();
          }, this);
        this["model"].bind('destroy', this.remove, this);

        var boxgroup = new Kinetic.Group({'name':"boxgroup"});

        this.boxgroup = boxgroup;
        this.activeArea = boxgroup;

        var pos = model.get("position");
        boxgroup.setScale({'x' :0, 'y': 0 });
        boxgroup.setPosition(pos.x + vWidth/2, pos.y + vHeight/2);
        //boxgroup.setScale({'x' :1, 'y': 1 });
        //boxgroup.setPosition(pos.x, pos.y);

        LOG && console.log("startPos:",pos.x,",",pos.y);


        var padding = 10;
        var rect = new Kinetic.Rect({
          x: padding,
          y: padding,
          width: vWidth - 2*padding,
          height: vHeight - 2*padding,
          fill: '#FFFFFF',
          stroke: '#FF0000',
          strokeWidth: 4
        });

        boxgroup.add(rect);

        var boxPadding = 20;
        var bboxWidth = vWidth - 2*boxPadding;
        var bboxHeigth = vHeight - 2*boxPadding;
        var bboxX = boxPadding;
        var bboxY = boxPadding;

        // add shop image
        that.createBrandbox(bboxX, bboxY, bboxWidth, bboxHeigth);


        layer.add(boxgroup);
        layer.draw();

        new Kinetic.Tween({
          'node': boxgroup,
          'x': pos.x,
          'y': pos.y,
          'scaleX': 1,
          'scaleY': 1,
          //rotation: Math.PI * 20,
          'duration': 0.5,
          'easing': Kinetic.Easings['StrongEaseOut'],
          'onFinish': function() {
            LOG && console.log("callback transform finished");
          }
        }).play();

        /*setTimeout(function() {
          var tween =

          tween.play();
        },100);*/


        this._super('initializeDragClick');

        var selected = false;
        this.activeArea.on("mouseover", function() {
          if (selected == false) {
            selected = true;
            that.options.viewEvent.trigger("selected");
          }
        });
        this.activeArea.on("mouseout", function() {
          if (selected == true) {
            selected = false;
            that.options.viewEvent.trigger("unselected");
          }
        });
      }
    },

    toggleOpenClose : function () {
      // item is clicked.
      LOG && console.log("toggle open close, this:",this);

      this.options.viewEvent.trigger("opened");
    },

    update : function() {

      var FunkyAnim = false;

      if (FunkyAnim && this['model'].hasChanged('position')) {

        // note: to use rotation nicely, the ItemView should be positioned with point 0,0 as the middle of the boxgroup,
        //   at the moment point 0,0 is the top left, which means rotations are done around top left instead of center.

        var mPos = this['model'].get('position');
        var pos = this.boxgroup.getPosition();

        LOG && console.log("go from ",pos.x,",",pos.y," -> ",pos.x+vWidth/2,",",pos.y+vHeight/2," -> ",mPos.x,",",mPos.y);

        pos.x += vWidth/20;
        pos.y += vHeight/20;

        // give a semi bit of rotation around center effect by rotating the group one way and its children the other way, while setting the children away from 0,0
        this.boxgroup.setPosition(pos.x, pos.y);
        this.boxgroup.setRotation(-Math.PI / 120);

        var children = this.boxgroup.getChildren();

        _.each(children, function(child){
          var childPos = child.getPosition();
          child.setPosition(childPos.x - vWidth/20, childPos.y - vHeight/20);
          child.setRotation(Math.PI/180);

          new Kinetic.Tween({
            'node':child,
            'x':childPos.x,
            'y':childPos.y,
            'scaleX':1,
            'scaleY':1,
            'rotation':0,
            'duration':0.5
          }).play();
        });
      }

      this._super('update');
    },

    removeFromLayer : function() {
      // prevent events on the 'model' to reach this update function.
      var model = this["model"];
      model.unbind();
      this._super('remove');

      my.saDemoViewModelCollection.remove(model);

      this.boxgroup.remove();
    }

  });

  return my;
}());
