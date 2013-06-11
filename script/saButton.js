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
var saClickHandled = 0;

var saButton = (function () {
  var my = {};
  var that = this;

  var INDEXNORMAL = 0;
  var INDEXBRIGHT = 1;

  var mouseoutTimer = null; // use one mouseoutTimer for all buttons - only one button can use the mouseoutTimer at a time..!!

  var clickcounter = 0;

  var saButtonImages = new saImage.Collection;

  _highlightFilter = function(imageData) {
    var data = imageData.data;
    for(var i = 0; i < data.length; i += 4) {
      //var brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
      // red
      data[i] += 20;
      // green
      data[i + 1] += 20;
      // blue
      data[i + 2] += 20;
      // i+3 is alpha (the fourth element)
    }
  };

  //holds only the data needed for the envelope view
  my.buttonModel = Backbone.Model.extend({
    // Default attributes for the envelopeModel item.
    'defaults' : function() {
      return {
      'title' : "",
      'image' : null, // if present, initialize will generate kImage
      'status' : "none",
      'position' : { x: 0, y: 0},
      'layer' : null,
      'group' : null,
      'animateNextMove': true,
      'opacity' : 1,
      'hidden' : false,
      'event' : null
      };
    },

    'initialize' : function() {
      var model = this;

      // assure an event is available
      if (!model.get('event')) {
        model.set('event', _.extend({}, Backbone.Events));
      }
    },

    'clear' : function() {

      this.destroy();
    }
  });


  function _updateHidden(model) {
    var hidden = model.get('hidden');
    var kImageGroup = model.get('kImageGroup');

    if (hidden) {
      kImageGroup.hide();
    }
    else {
      kImageGroup.show();
    }
  }

  /* button Model {
    'position' : {x: xpos, y: xpos},
    'title' : "reply",
    'image' : "reply78",
    'layer' : layer,         [or]
    'group' : scrollgroup,   [or]
    'hidden': false     [optional]
  }*/


  my.buttonView = Backbone.View.extend({

    'initialize' : function() {
      var that = this;

      var model = this['model'];
      if (model) {

        model.bind('change', this.update, this);
        model.bind('destroy', this.remove, this);

        this.render();
      }
    },

    render : function() {
      var model = this['model'];

      function addMouseStyling (theButton, model) {

        function _setBright(opacity, scale, immediate) {

          var buttonImage = theButton.getChildren()[INDEXNORMAL];

          var width = model.get("width");
          var height = model.get("height");
          var pWidth = buttonImage['attrs']['pWidth'];
          var pHeight = buttonImage['attrs']['pHeight'];
          var pScale = (width / pWidth < height / pHeight) ? (width / pWidth) : (height / pHeight);

          var duration = 0.3;

          if (immediate) {
            duration = 0.1;
          }

          //this.transitionBusy = true;
          //theButton.setListening(false);

          var tween = new Kinetic.Tween({
            'node':buttonImage,
            'x':-width*scale/2,
            'y':-height*scale/2,
            'scaleX':scale * pScale,
            'scaleY':scale * pScale,
            'duration': duration
          }).play();


          //var kImageBright = theButton.getChildren()[INDEXBRIGHT];

          // get position for new scale
          /*var width = theButton.getWidth();
          var height = theButton.getHeight();
          // todo: model is not correct reference here and theButton.position() has the issue of how to determine the original pos. It would be better to scale from center!
          var pos = model.get("position");
          pos.x -= width * (1 - scale) / 2;
          pos.y -= height * (1 - scale) / 2;
          */

          //todo: INDEXBRIGHT, second image in group doesnt match with svg's where the main image can consist of multiple children.
          //todo:  \_  for a single image, making a bright version with initial 0 opacity at index INDEXBRIGHT, there it works.
          /*

          if (kImageBright) {
            kImageBright.transitionTo({
              //'x':pos.x,
              //'y':pos.y,
              //'scale':{x:scale, y:scale},
              'opacity': opacity,
              'duration': 0.2
            });
          }

          */

          /*
          theButton.transitionTo({
            //'opacity': opacity,
            //'x':pos.x,
            //'y':pos.y,
            //'scale':{x:scale, y:scale},
            'duration': 0.2
          });*/
        }

        /*
        theButton.on("mouseenter", function() {
          LOG && console.log("mouseenter");
        });

        theButton.on("mouseleave", function() {
          LOG && console.log("mouseleave");
        });

        theButton.on("dblclick", function() {
          LOG && console.log("dblclick");
        });

        theButton.on("mouseup", function() {
          LOG && console.log("mouseup");
        });

        theButton.on("mousedown", function() {
          LOGU && console.log("mousedown");
        });

        theButton.on("dragstart", function() {
          LOG && console.log("dragstart");
        });
        */

        theButton.on("mouseover", function() {
          LOG && console.log("mouseover");

          if (mouseoutTimer) {
            clearTimeout(mouseoutTimer);
            mouseoutTimer = null;
          }
          if (this.restoreBrigthTimer) {
            clearTimeout(this.restoreBrigthTimer);
            this.restoreBrigthTimer = null;
          }

          $('#divgridCanvas').css('cursor', 'pointer');
          _setBright(0.3, 1.15, true);

        });

        theButton.on("mouseout", function() {
          LOG && console.log("mouseout");

          if (!mouseoutTimer) {
            var that = this;

            // try to give user chance to stay on the button - delay going for mouseout effect
            // also prevents fast flipping between in/out effect
            mouseoutTimer = setTimeout(function() {
              $('#divgridCanvas').css('cursor', 'default');
              mouseoutTimer = null;
            }, 0.5);
            // use a item specific timer to restore bright (size) vs a one general timer for the mouse pointer..
            this.restoreBrigthTimer = setTimeout(function() {
              _setBright(0, 1);
              that.restoreBrigthTimer = null;
            }, 0.5);
          }
        });


        theButton.on("click touchend", function(evt) {
          saClickHandled++;
          LOGU && console.log("click touchend ",clickcounter++);
          // todo: check if click is valid (cursor not moved out scope of button before release).
          model.get('event').trigger("click", evt);
        });
      }

      // if image is not yet loaded, add it to buttonImage collection
      // note: 'image' / imageName might not be available (text only button)
      var imageName = model.get('image');

      // an SVG type image? else assume PNG
      var svg = false;
      if (imageName && imageName.match(/\.svg$/i)) {
        svg = true;
      }

      var layer = model.get('layer');
      var group = model.get('group');
      if (layer || group) {

        function renderImage() {

          // remove previous rendered image, if available
          var kImageGroup = model.get('kImageGroup');
          if (kImageGroup) {
            if (group || layer) {
              //group.remove(kImageGroup);
              kImageGroup.remove();
            }
          }
          kImageGroup = new Kinetic.Group({'name':'kImageGroup'});


          var pos = model.get('position');
          var width = model.get('width');
          var height = model.get('height');
          var radius = width > height ? width: height;

          if (svg) {
            var buttonImage = saImage.getSVG(imageName, width, height);
            /*var hitregion = new Kinetic.Ellipse({
              'x': width/2,
              'y': height/2,
              'radius': {
                'x': width,
                'y': height
              },
              'fill': 'yellow'
            });*/

            function drawHitregion(canvas) {
              var context = canvas.getContext();
              context.save();
              context.beginPath();
              context.arc(width/2, height/2, radius, 0, Math.PI * 2, true);
              context.closePath();
              canvas['fillStroke'](this);
              context.restore();
            }

            /*var bChildren = buttonImage.getChildren();
            _.each(bChildren, function(child) {
              child.setAttrs({'drawHitFunc':drawHitregion});
            })*/

            var hitregion = new Kinetic.Shape({
              'drawHitFunc': drawHitregion
            });


            kImageGroup.add(buttonImage);

            kImageGroup.add(hitregion);
          }
          else if (imageName) {

            var theImage =imageModel.get("image");
            TLOG && console.log("  drawlayer, for button image loaded ",imageName," pos(",pos.x,",",pos.y,") ",pos," theImage:",theImage, " imageModel:",imageModel);

            // initialize image
            var imageConf = {
              'image': theImage, x: 0, y: 0,
              'name': imageName
              //'fill':
              //'opacity': 1
              /*
               detectionType : "pixel",
               shadow : {
               color : "black",
               blur : 10,
               offset : [10, 10],
               alpha : 0.5
               }
               */
            };

            if (width) {
              imageConf['width'] = width;
            }
            if (height) {
              imageConf['height'] = height;
            }

            var kImage = new Kinetic.Image(imageConf);
            var kImageBright = kImage.clone({'opacity':0, 'name':'bright'});
            kImageBright.applyFilter({
              'filter': _highlightFilter,
              'callback': function() {
                model.set({"kImageBright":kImageBright});
                // nothing to do (opt. layer.draw())
              }
            });

            // in specific order
            kImageGroup.add(kImage);       //INDEXNORMAL
            kImageGroup.add(kImageBright); //INDEXBRIGHT
          }


          var showTitle = model.get('showTitle');
          if (showTitle) {
            var textWidth = 100;
            var fontSize = 10;

            // determine position
            var textPos = {};
            if (showTitle == "below") {
              textPos.x = 0 + width/2 - textWidth/2;
              textPos.y = height + fontSize;
            }
            else if (showTitle.x || showTitle.y) {  // todo: if 0,0 is desired, this should be a type check (!NaN)
              textPos = showTitle;
              textPos.x -= textWidth/2 - width/2;
              textPos.y += height/2;
            }

            // show Title if it has a position
            if (textPos.x && textPos.y) {
              var buttonText = new Kinetic.Text({
                'x':textPos.x,
                'y':textPos.y,
                //stroke: '#555',
                //strokeWidth: 5,
                //'fill': '#d00',  //  <-- to debug size of textfield issues
                'text':model.get("title"),
                //'textStroke': '#FFF',
                //'textStrokeWidth': 0.1,
                'fontSize':fontSize + 2,
                'fontFamily':saFontFamily, //'Arial',
                'fill':"#1f0f29", //'#555',
                'width':textWidth,
                'height':fontSize * 2,
                //'lineHeight': 1,
                //'padding':2,
                'align':'center', //
                'fontStyle':'normal'
              });
              kImageGroup.add(buttonText);
            }
          }

          // todo: [center] option is not validated. It seems moving position of the children has no immediate effect.
          // by default, center is at 0,0 (top left) - if you want to rotate around another location, use center
          var center = model.get("center");
          if (center && width && height && pos) {

            var children = kImageGroup.getChildren();

            _.each(children, function(child) {
              var orgPos = child.getPosition();
              var childPos = {
                x :  orgPos.x - width * center.h,
                y :  orgPos.y - height * center.v
              };
              child.setPosition(childPos);
            });

            /*var mainPos = {
              x: pos.x + width * center.h,
              y: pos.y + height * center.v
            }
            kImageGroup.setPosition(mainPos);
            LOG && console.log("set realpos to:",pos);
            */
          }

          kImageGroup.setPosition(pos);




          model.set({'kImageGroup': kImageGroup}, {'silent':true});


          _updateHidden(model);


          if (group) {
            group.add(kImageGroup);
            if (!layer) {
              // try, because group may not yet be added to any layer. If not it will trigger a 'non_object_property_call' in kinetics

              var parent = group.getParent();

              if (parent) {

                try {
                  layer = group.getLayer();
                  if (layer) {
                    layer.draw();
                  }
                }
                catch(e) {
                  LOG && console.log(" error @ group.getLayer ",e);
                }

              }
            }
          }
          else if (layer) {
            // danger: layer is set in if(group) above - "else if" is crucial here.
            layer.add(kImageGroup);
            layer.draw();
          }

          addMouseStyling(kImageGroup, model);

          TLOG && console.log(" saButton drawn!");
        }

        if (svg || !imageName) {
          renderImage();
        }
        else if (imageName) {
          // async renderImage - image may need to be loaded by browser

          var imageModel = saImage.initImage(saButtonImages, imageName, "/img/" + imageName);

          imageModel.bind('change', function(){
            if (!model.get('kImageGroup')) {
              TLOG && console.log(" saButton: imageModel changed");
              renderImage();
            }
          }, model);

          if (imageModel.get('loaded')) {
            TLOG && console.log(" saButton: imageModel loaded");
            renderImage();
          }
        }
      }

    },

    update : function() {
      var model = this['model'];
      var that = this;
      var layer = model.get('layer');
      if (!layer) {
        var group = model.get('group');
        if (group) {
          layer = group.getLayer();
        }
      }
      TLOG && console.log(" saButton update ",this);

      // check if position changed
      var pos = model.get("position"); // desired position

      //todo validate [center] option
      /*var center = model.get("center");
      if (center) {
        var width = model.get("width");
        var height = model.get("height");
        pos.x += width * center.h;
        pos.y += height * center.v;
        LOG && console.log("update: corrected realpos to:",pos);
      }*/

      var kImageGroup = model.get('kImageGroup');
      var current_pos = kImageGroup.getPosition();
      if (pos.x !== current_pos.x || pos.y !== current_pos.y) {
        LOG && console.log(" saButton update setPosition ",pos.x,",",pos.y);
        kImageGroup.setPosition(pos);
      }

      if (model.hasChanged('layer')) {

        var newLayer = model.get('layer');
        LOGI && console.log(" moving button to newLayer ",newLayer._id);
        kImageGroup.moveTo(newLayer);
        //newLayer.add(kImageGroup);

        layer.draw();
        layer = newLayer;
      }

      if (model.hasChanged("hidden")) {
        _updateHidden(model);
      }

      if (model.hasChanged('zIndex')) {
        var zi = model.get('zIndex');
        kImageGroup.setZIndex(zi);
      }

      if (model.hasChanged('opacity')) {
        var opacity = model.get('opacity');
        LOG && console.log(" set opacity:",opacity);
        kImageGroup.setOpacity(opacity);
      }

      if (layer) {
        layer.draw();
      }
    },

    remove : function() {
      TLOG && console.log(" saButton remove ",this);

      // dont corrupt model attributes => it may be reused.
      var model = this['model'];

      var kImageGroup = model.get('kImageGroup');
      if (kImageGroup) {
        kImageGroup.off('mouseover mouseout click touchend'); // note: consider using setListening(false) - to ignore events. Clearing them seems better though.
        var layer = model.get('layer');
        if (layer) {
          //layer.remove(kImageGroup);
          kImageGroup.remove();
          layer.draw();
        }
        else {
          var group = model.get('group');
          if (group) {
            var layer = kImageGroup.getLayer();
            kImageGroup.remove();
            layer.draw();
          }
        }
      }
    }

  });

  my.initialize = function() {
    //button can be on any layer! !=> saButtonImages.setLayer(layer);
  }

  return my;
}());
