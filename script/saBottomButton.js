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
  not used in demo
 */
var saBottomButton = (function () {
  var my = {};
  var that = this;
  
  my.myButtonsModel = Backbone.Model.extend({
    // Default attributes for the envelopeModel item.
    'defaults' : function() {
      return {
        'position' : {x:0, y:0},
        'activeButton' : 0,
        'buttonClicked' : false,   // buttonClicked, true -> all options are shown, false -> all are folded and active button is shown
        'groupID' : "",
        'buttonArray' : [],
        'event' : null,
        'screenPos' : null
      };
    },

    'initialize' : function() {
    },
    
    'clear' : function() {
      this.destroy();
    }
  });

  my.buttonPanelHeight = 54; //pixels
  my.buttonHeight = 30; //54; // pixels
  my.buttonWidth = 140; // pixels
  
  my.bottomButtonView = Backbone.View.extend({
    
    'initialize' : function() {
      var that = this;
      var layer = this.options.layer;
      var stage = layer.getStage(); 
      
      var buttonArray = this["model"].get("buttonArray");
      that.floatingButtonArray = [];
      
      //this["model"].bind('change:screenPos', this.update, this);
      this["model"].bind('change', this.update, this);
      
      var masterButtonFrame = that.createTabButtonFrame(0, 0);
      var shineShape = that.createTabButtonShine(0,0);
      LOG && console.log("this[model]",this["model"]);
      var active = this["model"].get("activeButton");
      LOG && console.log(" active:",active);
      var masterButtonText = that.createTabButtonText(0, 0, buttonArray[active].name);
      
      var tabButton = new Kinetic.Group({'name':"tabButton"});
      
      tabButton.add(masterButtonFrame);
      tabButton.add(shineShape);
      tabButton.shineShape = shineShape; // todo: dont do this
      tabButton.add(masterButtonText);
      tabButton.buttonNr = active;
      
      function addMouseStyling (theButton) {
        theButton.on("mouseover", function() {
          $('#divgridCanvas').css('cursor', 'pointer');
          //theButton.setImage(imgBright);
          theButton.getLayer().draw();

          LOG && console.log(" theButton.buttonNr:",theButton.buttonNr," mO:",theButton.mouseOver," activeNr:",that["model"].get("activeButton"));
          // show all buttons on mouseover
          if (!theButton.mouseOver  &&
            // is theButton the active button (the one on the bar) ?
            theButton.buttonNr == that["model"].get("activeButton")
            // is the button array folded?
            && !that["model"].get('buttonClicked')) {
            // simulate click, so on mouseover all options are shown
            buttonClick.apply(theButton);
          }

          theButton.mouseOver = true;
        });
        theButton.on("mouseout", function() {
          document.body.style.cursor = "default";
          //theButton.setImage(imgNormal);
          
          theButton.mouseOver = false;
          
          theButton.shineShape.setOpacity(0);
          
          theButton.getLayer().draw();
        });
        theButton.on("mousedown touchstart", function() {
          LOG && console.log("show shine");
          theButton.shineShape.setOpacity(0.05);
          theButton.getLayer().draw();
        });
        theButton.on("mouseup touchend", function() {
          theButton.shineShape.setOpacity(0);
          LOG && console.log("end shine");
          theButton.getLayer().draw();
        });
      }
      
      addMouseStyling(tabButton);
      
      function buttonClick() {

        LOGI && console.log("buttonClick triggered");

        if (that.closeTimer) {
          clearTimeout(that.closeTimer);
          that.closeTimer = null;
        }
        
        LOG && console.log(that["model"].get("groupID"), " clicked ",this);
        if (this.moveToTop) {
          this.moveToTop();
        }
        
        function animateDown(button, removeAfter) {
          LOG && console.log(" animateDown: ",button.getName());
          
          var pos = that["model"].get("position");
          
          var cb = null;
          if (removeAfter) {
            button.off("click touchend");
            
            cb = function() {
              LOGI && console.log("remove floating button ",that.floatingButtonArray.length," button:",button," name:",button.getName());

              // check if button is still on the layer
              // if so, remove it. It might have been removed before callback.
              var buttonLayer = button.getLayer();
              if (buttonLayer) {
                var children = buttonLayer.getChildren();
                var child = _.find(children, function(child){return child === button;});

                if (child) {
                  // remove it from its current layer
                  LOGI && console.log(" removingAfter: ",button);
                  //button.getLayer().remove(button);
                  button.remove();

                  saIntersect.removeElement(button.getName());

                  that.floatingButtonArray = _.without(that.floatingButtonArray, button);
                  that.options.layer.draw();
                  that.options.layerTop.draw();
                }
              }
            };
          }
          else {
            cb = function() {
              saIntersect.removeElement(button.getName());

              // make sure its no longer on layerTop
              button.moveTo(that.options.layer);
              that.options.layer.draw();
            };
          }

          var tween = new Kinetic.Tween({
            'node': button,
            'x': pos.x,
            'y': pos.y,
            'rotation' : 0,
            'duration': 0.18,
            'onFinish' : cb
          }).play();
          
          that.options.layer.draw();
        }
        
        if (that["model"].get("buttonClicked") === true) {
          // remove floating buttons.
          LOG && console.log("remove floating buttons:",that.floatingButtonArray.length," except:",this.getName());
          var chosenButton = this;
          _.each(that.floatingButtonArray, function(button) {
             if (button !== chosenButton) {
               animateDown(button, true);
             }
             else {
               animateDown(button, false);
             }
          });
          that.options.layer.draw();
          that["model"].set({'buttonClicked' :false},{'silent':false});
        }
        else  {
          that.closeTimerFunction = function() {
            //var active = that["model"].get("activeButton");

            if (that.closeTimer) {
              clearTimeout(that.closeTimer);
              that.closeTimer = null;

              // the active button is pushed first on the array
              if (that.floatingButtonArray) {
                var activeButton = that.floatingButtonArray[0];
                buttonClick.apply(activeButton);
              }
            }

          };

          that.closeTimer = setTimeout(that.closeTimerFunction, 5000);
          
          that["model"].set({'buttonClicked' :true},{'silent':true});
          LOG && console.log(" draw other options");
          
          // move this button to begin of the array
          that.floatingButtonArray = _.without(that.floatingButtonArray, this);
          that.floatingButtonArray.splice(0,0,this);
          
          // draw the other options
          var l = buttonArray.length;
          var active = that["model"].get("activeButton");
          var pos = that["model"].get("position");
          // vertical center it
          //pos.y += (my.buttonPanelHeight - my.buttonHeight) /2;
          
          var cnt = 0;
          
          LOG && console.log(" active button:",active);
          
          for (var n = 0; n < l; n++) {
            if ( n !== active) {
              cnt++;
              var x = pos.x;
              var y = pos.y - (cnt * (my.buttonHeight+ 14)); //+20
              var name = buttonArray[n].name;
              
              var tabButtonFloat = new Kinetic.Group({'name':name});
              tabButtonFloat.buttonNr = n;
              
              var buttonFrame = that.createTabButtonFrame(0, 0);
              var shineShape = that.createTabButtonShine(0,0);
              var buttonText = that.createTabButtonText(0, 0, name);
              
              
              tabButtonFloat.add(buttonFrame);
              tabButtonFloat.add(shineShape);
              tabButtonFloat.shineShape = shineShape; // todo: dont do this
              tabButtonFloat.add(buttonText);
              addMouseStyling(tabButtonFloat);
              
              tabButtonFloat.on("click touchend", function() {
                LOGI && console.log(that["model"].get("groupID"), " tabButtonFloat clicked ");
                
                if (that.closeTimer) {
                  clearTimeout(that.closeTimer);
                  that.closeTimer = null;
                }
                
                //LOG && console.log("this:",this," tabButtonFloat:",tabButtonFloat);
                
                that["model"].set({'activeButton':this.buttonNr},{'silent':true});
                
                //tabButton.off("click touchend");
                //that.options.layer.remove(tabButton);
                var myself = this;
                
                // remove any other floating buttons.
                _.each(that.floatingButtonArray, function(button) {
                  if (button !== myself) {
                    animateDown(button, true);
                  }
                  else {
                    animateDown(button, false);
                  }
                });
                
                /*var pos = that["model"].get("position");
                this.transitionTo({
                  rotation : 0,
                  duration : 0.18
                });
                this.setPosition(pos);*/
                
                this.off("click touchend");
                this.on("click touched", buttonClick);
                
                /*
                var children = tabButton.getChildren();
                
                var text = _.find(children, function(child) { return child.name === "text";});
                LOG && console.log("removing:",text);
                tabButton.remove(text);
                
                tabButtonFloat.remove(buttonText);
                
                tabButton.add(buttonText);
                */
                
                that.options.layer.draw();
                
                LOG && console.log("trigger ",that["model"].get("groupID"),"  ", buttonArray[this.buttonNr].filterName);
                var event = that["model"].get("event");
                event.trigger(that["model"].get("groupID"), buttonArray[this.buttonNr].filterName);
                that["model"].set({'buttonClicked' :false},{'silent':false});
              });
              
              
              tabButtonFloat.setPosition(pos.x, pos.y);
              
              var screenPos = that["model"].get("screenPos");
              var a = (screenPos.width - x);
              
              var b = pos.y - y;
              
              LOG && console.log("a:",a," b:",b);
              
              var opacity = Math.atan(b / a);
              
              LOG && console.log(" opacity:",opacity);
              
              var adj = Math.cos(opacity) * a;
              
              var diffX = a - adj;
              
              LOG && console.log("diffX:",diffX);
              
              x = x + diffX;

              // svdv: make sure its on top
              that.options.layerTop.add(tabButtonFloat);

              that.floatingButtonArray.push(tabButtonFloat);
              
              
              // main button is at top
              tabButtonFloat.moveDown();

              saIntersect.registerElement({
                pos: {
                  x: x + my.buttonWidth / 2,
                  y: y + my.buttonHeight / 2
                },
                id: name,
                setHighlight: function() {

                  LOGI && console.log(" request button highlight ",tabButtonFloat);

                  clearTimeout(that.closeTimer);


                  var tween = new Kinetic.Tween({
                    'node':tabButtonFloat,
                    'opacity' : 0.2,
                    'duration' : 0.2
                  }).play();
                },
                removeHighlight: function() {

                  that.closeTimer = setTimeout(that.closeTimerFunction, 1000);

                  var tween = new Kinetic.Tween({
                    'node':tabButtonFloat,
                    'opacity' : 1,
                    'duration' : 0.2
                  }).play();

                }
              });


              var tween = new Kinetic.Tween({
                'node':tabButtonFloat,
                'x': x,
                'y': y,
                'rotation' : opacity,
                'duration' : 0.18,
                //'saName' : name,
                //'saButton' : tabButtonFloat,
                //opacity: that["model"].get("opacity"),
                'onFinish': function() {

                  // transition is completed, remove it and reset that.targetPos to null
                  //that.trans = null;
                  //that.targetPos = null;
                }
              }).play();
            }  
          }
          that.options.layer.draw();
          
          //
        }
      }
      
      tabButton.on("click touchend", buttonClick);
      
      var pos = that["model"].get("position");
      tabButton.setPosition(pos.x, pos.y);
      //that["model"].set({buttonClicked :true},{silent:false});
      layer.add(tabButton);
      that.floatingButtonArray.push(tabButton);
      layer.draw();
      
    },
    
    createTabButtonShine: function(x, y) {
      var shineShape = new Kinetic.Rect({
        'x': x,
        'y': y,
        'width': my.buttonWidth,
        'height': my.buttonHeight,
        'fill': "#FFFFFF",
        'opacity': 0
      });
      return shineShape;
    },
    
    createTabButtonFrame: function(x, y) {
      
      var tabButtonFrame = new Kinetic.Shape({
        'drawFunc': function(canvas) {
          var context = canvas.getContext();
          var bx = x; //lc.bottomPanelSize.x + lc.bottomPanelSize.xUsed + 10;
          var by = y; //lc.bottomPanelSize.y + 3;
          var bw = my.buttonWidth;
          var bh = my.buttonHeight;

          context.save();
          // set shadow params
          context.beginPath();
          context.shadowOffsetX = 0;
          context.shadowOffsetY = 2;  
          context.shadowBlur = 6;  
          context.shadowColor = "rgba(0, 0, 0, .75)"; 
          
          
          //context.fillRect(bx, by, bw, bh);
          context.rect(bx, by, bw, bh);
          
          //context.fill();
          this.fill(context);
          context.restore();
        },
        'fill': "371a4b", //"#4aa9db", //"#3F3F3F", 
        'name': "tabButtonFrame"
      });
      
      return tabButtonFrame;
    },
    
    createTabButtonText : function(x, y, buttonText) {
      var tabButtonText = new Kinetic.Text({
        'x': x+10,
        'y': y+6, //+4
        'text': buttonText,
        'fontSize': 16,
        'fontFamily': saFontFamily,
        //context.font = "12pt Arial";
        'fill': "#CCCCCC",
        'stroke': "#EEEEEE",
        'align': "left",
        'verticalAlign': "top",
        'name': "text"
      });
      return tabButtonText;
    },
    
    update : function() {
      LOG && console.log("screenPos update is not used");
    },
    
    destroy : function() {
      var that = this;
      LOGI && console.log(" destroy...!! ",that);
      
      if (that.closeTimer) {
        clearTimeout(that.closeTimer);
        that.closeTimer = null;
      }
      
      if (that.floatingButtonArray) {
        LOGI && console.log(" length:",that.floatingButtonArray.length);
      }
      
      // remove all buttons.
      _.each(that.floatingButtonArray, function(button) {
        LOGI && console.log(" remove:",button);
        //button.getLayer().remove(button);
        button.remove();
        saIntersect.removeElement(button.getName());
      });

      that.floatingButtonArray.length = 0; // was [ ]
    }
  
  });
  
  return my;
}());