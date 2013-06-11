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


/*
     not used in demo -
 */
var saBackground = (function () {
  var bg = {};
  var that = this;
  
  /** @const */
  var DarkEdgeAvailable = false; // light effect, giving 3d impression of grid floating in front of background
  /** @const */
  var FeetAvailable = false; // decorative feet on the background
  
  var images = new saImage.Collection;
  
  bg.initialize = function() {
    // general module initialization.
    //saImage.initImage(images, "darkedge","/img/darkedge.png");
    //saImage.initImage(images, "feet","/img/feet.png");
  };
  
  
  
  bg.view = Backbone.View.extend({
    'initialize' : function() {
      var that = this;
      var layer = this.options.layer;
      var stage = layer.getStage();
      var screenPos = this["model"].get("position");
      
      
      if (DarkEdgeAvailable) {
	      var darkEdge = _.find(images["models"], function(image) {return image.get("name") === "darkedge";});
	
	      TLOG && console.log("darkEdge:",darkEdge," images.models.length",images["models"].length);
	
	      this.dEdge = new Kinetic.Image({
	        'image': darkEdge.get("image"), x: screenPos.x, y: screenPos.y,
	        'name': "darkedge",
	        'opacity': 0.5
	      });
	
	      this.positionDarkEdge();
	      
	      // bind change, e.g. caused by image src finished loading, to redraw
	      darkEdge.bind("change", function() {
	        TLOG && console.log(" darkEdge loaded: ",darkEdge.get("name"));
	        this.dEdge.setImage(darkEdge.get("image"));
	        layer.draw();

          // todo: edit to use tweens
	        /*this.dEdge.transitionTo({
	          //'scale' : {x:0.5,y:0.5},
	          'opacity' : 1,
	          'duration': 1
	        });*/
	      }, this);
	  }      
      
      if (FeetAvailable) {
	  	  LOG && console.log(" init feet! ",screenPos.width,"x",screenPos.height);      
      	  var imageFeet = _.find(images["models"], function(image) {return image.get("name") === "feet";});
      
	      var pos = this.feetPos();
	      this.kFeet = new Kinetic.Image({
	        'image': imageFeet.get("image"), x: pos.x, y: pos.y,
	        'name': "feet",
	        'centerOffset': [50,50],
	        'rotation': Math.PI * 1.2 // PI * 2 == 360 degrees
	        });
	      
	      // bind change, e.g. caused by image src finished loading, to redraw
	      imageFeet.bind("change", function() {
	        LOG && console.log(" imageFeet loaded: ",imageFeet.get("name"));
	        this.kFeet.setImage(imageFeet.get("image"));
	        layer.draw();
	      }, this);
	  }     
      
      this["model"].bind("change", this.update, this);
      
      //LOG && console.log(" kImage: ",kImage);





	  if (DarkEdgeAvailable) {
	  	layer.add(this.dEdge);
	  }
	  if (FeetAvailable) {
        layer.add(this.kFeet);
      }

      layer.draw();
    },



    positionDarkEdge: function () {
      var screenPos = this["model"].get("position");
      
      // outofArea trick will make the image in principle bigger than the 'chrome?' size, when resizing in chrome you have much less visibility of the areas where the darkedge is not yet set (stretched to).
      
      var outofArea = 0; //(screenPos.width + screenPos.height) / 10;

      var width = screenPos.width;
      var height = screenPos.height - screenPos.voffset; //- screenPos.vbottomoffset;

      var xScale = (width + outofArea*2) / 420;
      var yScale = (height + outofArea*2) / 420;

      this.dEdge.setScale(xScale, yScale);
      this.dEdge.setPosition(screenPos.x, screenPos.y + screenPos.voffset); //(-outofArea, -outofArea);
    },
    
    feetPos : function() {
      var screenPos = this["model"].get("position");
      var pos = {x: screenPos.x + (screenPos.width * 0.1), y : screenPos.y + (screenPos.height * 1) - 100 };
      return pos;
    },
  
    update : function() {
      var that = this;

      if (DarkEdgeAvailable) {
      	this.positionDarkEdge();
	  }    
	  
      if (FeetAvailable) {
	      var pos = this.feetPos();
	      var currentPos = this.kFeet.getPosition();
	      LOG && console.log(" background, pos:",pos," current:",currentPos);
	      
	      //if (currentPos.x !== pos.x || currentPos.y !== pos.y) {

          // todo: edit to use tweens
          /*this.kFeet.transitionTo({
	          'x': pos.x,
	          'y': pos.y,
	          //centerOffset: {x:0, y:0},
	          //scale: {x :1, y: 1 },
	          //rotation: Math.PI * 20,
	          'duration': 0.1,
	          'callback': function() {
	            that.options.layer.draw();
	          }
	        });*/
	      //}
	  }      
      
      this.options.layer.draw();
    }
  });
  
  return bg;
}());
