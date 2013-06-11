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
 * module: saLayerControls
 * 
 * tasks:
 * Provide UI controls
 * 
 */
var saLayerControl = (function () {
  var lc = {};
  var that = this;
  
  var images = new saImage.Collection;

  var currentCirclesCount = 0;
  var circles = []; // clean and initialize

  
  lc.bottomPanelSize = {x:0, height:saBottomButton.buttonPanelHeight + 6};
  
  lc.initialize = function(layer) {
    // general module initialization.
    saImage.initImage(images, "settings","/img/settings_ico.png");
    saImage.initImage(images, "settingsBright","/img/settings_icob.png");

    images.event.on("allLoaded", function() {
      layer.draw();

      // todo fix / remove this dirty work around - trigger another draw when webfont is loaded!
      // todo: define functione - not dynamic create it
      var redrawTimer = setTimeout(function() {
        clearTimeout(redrawTimer);
        redrawTimer = null;
        layer.draw();
      }, 1000); //1[sec]

    }, this);
  };

  lc.buttonsModel = Backbone.Model.extend({
    // Default attributes for the envelopeModel item.
    'defaults' : function() {
      return {
      'filter': "",
      'sort': ""
      };
    },

    'initialize' : function() {
      // nothing to do here.
    },

    'clear' : function() {
      this.destroy();
    }
  });
  
  function setActiveCircle (circles, layerIndex) {
    for (var n=0; n<circles.length; n++) {
      if (n == layerIndex) { 
        circles[n].setAttrs({'fill' : "#FFF"}); //<- transparant!  //"#00c0f3" //"#e9e8db"}); //"white";
      }
      else {
        circles[n].setAttrs({'fill' : "rgba(0,0,0,0)"}); //"#616161"}); //"gray";
      }
    }
  }

  function drawSettings(that) {
    var screenPos = that["model"].get("position");
    var settingsImage = images.getByName("settings");
    var layer = that.options.layerBottom;
    var settingsPos = {x:screenPos.width - 100 + screenPos.x, y: 10 + screenPos.y};

    if (that.kSettings) {
      that.kSettings['model'].set({'position' : settingsPos});
      // make sure that the image is properly drawn and not below Z0:
      //that.kSettings.moveToTop();
    }
    else {
      removeControls(that, "settings");

      // ############  saButton test ################

      settingsModel = new saButton.buttonModel({
        'position' : settingsPos,
        'title' : "settings",
        'image' : "settings.svg",
        'width' : 32,
        'height': 32,
        //'image' : "icons/settings.svg",
        //'image' : "icons/settings_ico.png",
        'layer' : layer
      });

      that.kSettings = new saButton.buttonView({
        'model': settingsModel
      });

      settingsModel.get('event').on('click', function() {
        var tempdiv = $('#tempdiv');
        tempdiv.html("<form id=\"settingsForm\" method=\"POST\" action=\"settings.php\" target=\"_blank\"> \
          <input type=\"hidden\" name=\"name\" type=\"text\" value=\""+username+"\"> \
          <input type=\"hidden\" name=\"password\" type=\"password\" value=\""+userpass+"\"> \
          </form>");

        LOG && console.log("submit tempdiv:",tempdiv);

        /*

         // to load the page into divsettings iso opening a new page!

         $('#settingsForm').submit(function() { // catch the form's submit event
         $('#divsettings').show();
         $('#divsettings').html("<h1>loading</h1>");
         console.log("data:",$(this).serialize());
         console.log("type:",$(this).attr('method'));
         $.ajax({ // create an AJAX call...
         data: $(this).serialize(), // get the form data
         type: $(this).attr('method'), // GET or POST
         url: $(this).attr('action'), // the file to call
         success: function(response) { // on success..
         //console.log(response);
         $('#divsettings').html(response); // update the DIV
         }
         });
         return false; // cancel original event to prevent form submitting
         });
         */

        $('#settingsForm').submit();


        //var q=(document.location.href);
        //void(window.open('https://www.shopaunt.com/settings.php?name='+username+'&password='+userpass,'_blank','','false'));
      });

      // ############################################

    }
    layer.draw();
  }

  function drawCircles(that) {
    var layer = that.options.layerTop; //that.options.layerBottom;
    var screenPos = that["model"].get("position");

    var cRadius = 5; //9
    var cspacing = cRadius * 4; //36; // 9 * 4
      
    var cn = that["model"].get("layerLength");
    
    var circleShadow = false;
    
    //if (cn != currentCirclesCount) {
    currentCirclesCount = cn;
    circles.length = 0; // clean and initialize


    // optional: make updating of the circles conditional
    if (layer) {
      // refresh circles
      removeControls(that, "circle", layer);

      LOG && console.log("drawCircles: ",cn," 'model': ",that["model"]);
      
      var x = screenPos.x + (screenPos.width/2 - (cn * cspacing)/2);
        
      for (var n = 0; n < cn; n++) {

          // anonymous function to induce scope
          (function() {

            var circle = new Kinetic.Circle( {
              'x': x+(cspacing*n),
              'y': screenPos.cy - cRadius/2,
              'radius': cRadius,
              'fill': '#FFF',
              'stroke': '#FFF',
              'strokeWidth': 1.5,
              'name':'circle'
            });
            /*var circle = new Kinetic.Shape({
                    'drawFunc': function(canvas){
                        var context = canvas.getContext();

                        // create the drop shadow
                        //  set shadow params
                        if (circleShadow) {
	                        context.save();
	                        
	                        context.beginPath();
	
	                        context.shadowOffsetX = 2;
	                        context.shadowOffsetY = 2;  
	                        context.shadowBlur = 8;  
	                        context.shadowColor = "rgba(0, 0, 0, .75)"; 
	                              
	                        //  shadow source 
	                        //context.beginPath();
	                        context.arc(0, 0, cRadius, 0, Math.PI * 2, true);

                          context.closePath(); //A
                          //A this.fill(context);
	                        context.fill();

	                        // Remove shadow settings for further drawing
	                        context.restore();
						}	                        

                        // the circle with a fill itself
                        context.beginPath();
                        context.arc(0, 0, cRadius, 0, Math.PI * 2, true);

                        var theFillStyle = this.getAttrs()['fillStyle'];
                        if (!theFillStyle) {
                          //console.log("oh, no fillstyle yet..");
                          theFillStyle = "#FFF"; //"#616161";
                        }
                        context.fillStyle = theFillStyle; // updated in
                                                          // setActiveCircle()

                        //A this.fill(context);
                        context.fill();
                        context.lineWidth = 1; //2;

                        //A context.strokeStyle = "#FFF"; //"#1f1f1f";
                        //A this.stroke(context);
                        context.stroke();

                        context.restore();
                    },
                    'fill':"#FFF",//"#616161",
                    'lineWidth': 1, //2,
                    'stroke': "#FFF",//"#1f1f1f",
                    'name': "circle"
            });
            */

            
            //LOG && console.log("drawCircles ",circle);

            //circle.setPosition(x+(cspacing*n), screenPos.cy - cRadius/2);

            // store index in circle object
            circle.setAttrs({'layerIndex' : n });
            
            circle.on("mouseover", function() {
              $('#divgridCanvas').css('cursor', 'pointer');
            });
            circle.on("mouseout", function() {
              $('#divgridCanvas').css('cursor', 'default');
            });
            
            circle.on("click touchend", function() {
                //setActiveCircle (circles, this.layerIndex);
                //layer.draw();
                
                // signal parent
                var li = this.getAttrs()['layerIndex'];
                that.options.viewEvent.trigger("circleClicked", li);
            });
            
            layer.add(circle);

            circles.push(circle);
          })()
      }

      var activeLayerIndex = that["model"].get("activeLayer");
      
      setActiveCircle (circles, activeLayerIndex);
      
      layer.draw();
    }
  }
  
  function removeControls(that, name, customLayer) {
    var layer = that.options.layerBottom;
    if (customLayer) {
      layer = customLayer;
    }
    var kObjects = layer.getChildren();

    // go backwards through array - as removing items effects the array
    for (var n=kObjects.length-1; n>=0; n--) {
      
      if (kObjects[n].getName() === name) {
        LOG && console.log("layerControls remove item:",kObjects[n].getName());
        //kObjects[n].setListening(false);
        //kObjects[n].hide();
        //layer.remove(kObjects[n]);
        kObjects[n].remove();
      }
      else {
        //kObjects[n].moveToTop();
      }
          
    }
    //layer.draw();
  }
  
  
  function drawArrows(that) {
    // #######################################################
    //   arrows
    // #######################################################

    var arrowSize = 50;

    // initialize ?
    if (!that.leftArrow || !that.rightArrow) {
      function genArrow(left, height) {
        var arrow = new Kinetic.Shape({
          drawFunc: function(canvas) {
            var context = canvas.getContext();
            context.save();
            var width = height /2;

            context.beginPath();
            if (left) {
              context.moveTo(width, 0);
              context.lineTo(0, height/2);
              context.lineTo(width, height);
            }
            else { // mirror y-axis
              context.moveTo(0, 0);
              context.lineTo(width, height/2);
              context.lineTo(0, height);
            }
            //context.closePath();

            canvas['fillStroke'](this);

            //context.fill();

            //context.stroke();
            //that.fill(context);
            //A this.stroke(context);
            context.restore();
          },
          //'fill': "#000000",
          // use a white shadow upwards, to ensure contrast on dark background - that the triange tip is visible
          /*'shadow': {
           'color': '#000000',
           'blur': 3,
           'offset': [0, 0],
           'alpha': 0.3
           },*/
          stroke: "#FFF",
          strokeWidth: 1.5
        });

        return arrow;
      }

      function genClickAreaArrow(left, height) {
        var arrow = new Kinetic.Rect({
          'x':0,
          'y':0,
          'width': height,
          'height':height,
          'fill':'rgba(0,0,0,0)' // invisible
        })

        arrow.on("click touchend", function() {
          //setActiveCircle (circles, this.layerIndex);
          //layer.draw();

          // signal parent
          var li = saLayers.getActiveLayerIndex();
          if (left) {
            li--;
          }
          else {
            li++;
          }
          // reuse circle click event, same principle - to pass List Index (li)
          that.options.viewEvent.trigger("circleClicked", li);
        });

        return arrow;
      }

      that.leftArrow = genArrow(true, arrowSize);
      that.rightArrow = genArrow(false, arrowSize);

      var layer = that.options.layerBottom;
      layer.add(that.leftArrow);
      layer.add(that.rightArrow);

      that.leftArrowVirtual = genClickAreaArrow(true, arrowSize);
      that.rightArrowVirtual = genClickAreaArrow(false, arrowSize);

      layer = that.options.layerTop;
      layer.add(that.leftArrowVirtual);
      layer.add(that.rightArrowVirtual);
    }

    // -- positionArrows(); ----
    var screenPos = that["model"].get("position");
    var y = screenPos.voffset - arrowSize + (screenPos.gridHeight / 2);
    that.leftArrow.setPosition(22, y);
    that.leftArrowVirtual.setPosition(22 - arrowSize/2, y);
    that.rightArrow.setPosition(screenPos.width - 22 - arrowSize/2, y);
    that.rightArrowVirtual.setPosition(screenPos.width - 22 - arrowSize/2, y);

    var activeLayerIndex = that["model"].get("activeLayer");
    var maxLayerIndex = that["model"].get("layerLength");


    // rightarrow visible?
    if (activeLayerIndex == maxLayerIndex -1) {
      that.rightArrow.hide();
      that.rightArrowVirtual.hide();
    }
    else {
      that.rightArrow.show();
      that.rightArrowVirtual.show();
    }

    // leftarrow visible?
    if (activeLayerIndex > 0) {
      that.leftArrow.show();
      that.leftArrowVirtual.show();
    }
    else {
      that.leftArrow.hide();
      that.leftArrowVirtual.hide();
    }


  }

  function drawUsername(that) {
    var layer = that.options.layerBottom;
    var screenPos = that["model"].get("position");

    if (!lc.userAccountText) {
      lc.userAccountText = true;

      var fontsize = 14;
      var x = 14 + screenPos.x;
      var y = screenPos.y + screenPos.voffset/2 - fontsize/2;

      LOG && console.log("ua text:",x,",",y,"  divgridtop:",screenPos.divgridtop,"  screenPos:",screenPos);

      var userAccountText = new Kinetic.Text({
        'x': x,
        'y': y,
        'text': username+"@shopaunt.com",
        'fontSize': fontsize,
        'fontFamily': saFontFamily,
        //context.font = "12pt Arial";
        'fill': "#ffe783",
        //'textStroke': "#EEEEEE",
        'align': "left",
        'verticalAlign': "hanging", //http://books.google.es/books?id=zFvRqdL_pUAC&pg=PA86&lpg=PA86&dq=html5+canvas+text+verticalalign&source=bl&ots=b5S7A76Arz&sig=rMY4vf3WKqkP6j1xbTGPfZVOaAY&hl=en&sa=X&ei=vQ4tUIX8EcOwhAf0nYCQAw&ved=0CGsQ6AEwCQ#v=onepage&q&f=false
        'name': "text"
      });

      //userAccountText.setPosition(20,)

      //todo: unify mousestyling
      function addMouseStyling (theButton) {
        theButton.on("mouseover", function() {
          $('#divgridCanvas').css('cursor', 'pointer');
          theButton.getLayer().draw();
        });
        theButton.on("mouseout", function() {
          $('#divgridCanvas').css('cursor', 'default');
          theButton.getLayer().draw();
        });
      }

      addMouseStyling(userAccountText);

      userAccountText.on("click touchend", function() {
        that.options.viewEvent.trigger("logout");
      });

      layer.add(userAccountText);

      layer.draw();
    }
  }

  function drawDeleteButton(that) {
    var layer = that.options.layerBottom;
    var screenPos = that["model"].get("position");

    // picture is 33x40
    var trashWidth = 33;
    var trashHeigth = 40;

    var centerh = 28/32;
    var centerv = 12/42;

    var wcw = 680; //getCssNumber('#wrapper_content','clientWidth');
    var fbl = getCssNumber('#footer_bin','left');
    var x = (screenPos.width /2) - wcw/2 + fbl;   //screenPos.width * 0.72; //lc.bottomPanelSize.width - 100;
    var y = screenPos.height + getCssNumber('#footer_bin','top');//+ $('#wrapper_footer').height() / 2 - trashHeigth/2; //lc.bottomPanelSize.y + 10;

    function registerDeleteIntersect(deleteButtonModel) {

      saIntersect.registerElement({
        pos: {
          'x': x + (trashWidth/2), //16,
          'y': y + (trashHeigth/2) //20
        },
        id: "delete",
        setHighlight: function() {

          $("#footer_bin").hide();
          deleteButtonModel.set({hidden:false});

          var button = deleteButtonModel.get('kImageGroup');

          var pos = deleteButtonModel.get("position");

          /*var width = deleteButtonModel.get("width");
          var height = deleteButtonModel.get("height");
          var center = deleteButtonModel.get("center");
          */

          LOG && console.log(" request button highlight ",this," at ",pos.x,",",pos.y);

          var increaseFactor = 2;
          //var pos = button.getPosition();
          var nx = pos.x + ((centerh) * trashWidth) * increaseFactor / 4; //33/2;
          var ny = pos.y; // + centerv * trashHeigth - trashHeigth/increaseFactor; //40/2;

          var tween = new Kinetic.Tween({
            'node':button,
            'scaleX':increaseFactor,
            'scaleY': increaseFactor,
            'x' : nx,
            'y' : ny,
            'rotation': Math.PI * 0.1,
            'duration': 0.3,
            'onFinish' : function() {
              var pos = deleteButtonModel.get("position");
              LOG && console.log("  transition done highlight ",this," at ",pos.x,",",pos.y);
            }
          }).play();

        },
        removeHighlight: function() {
          var button = deleteButtonModel.get('kImageGroup');

          var pos = deleteButtonModel.get("position");

          var nx = pos.x;
          var ny = pos.y;

          LOG && console.log(" request button normal ",this," at ",nx,",",ny);

          var tween = new Kinetic.Tween({
            'node': button,
            'scaleX':1,
            'scaleY': 1,
            'rotation': 0,
            'x' : nx,
            'y' : ny,
            'duration': 0.3,
            'onFinish' : function() {
              deleteButtonModel.set({hidden:true});
              $("#footer_bin").show();
            }
          }).play();
        }
      });

    }


    if (!lc.deleteButton) {
      lc.deleteButton = true;

      var deleteButtonModel = new saButton.buttonModel({
        'position' : {x:x + centerh * trashWidth, y:y + centerv * trashHeigth},
        'center': {h:centerh, v:centerv}, //{h:0, v:0},
        'width' : trashWidth,
		    'height': trashHeigth,
        'title' : "delete",
        'image' : "trashcan.svg",
        //'image' : "icons/trashcan.svg",
        'layer' : layer, //that.options.layerTop
        'hidden': true
      });

      that.kDelete = new saButton.buttonView({
        'model': deleteButtonModel
      });

      registerDeleteIntersect(deleteButtonModel);

      deleteButtonModel.get('event').on('click', function() {
        LOG && console.log(" delete button clicked");
      });

      this.deleteButtonModel = deleteButtonModel;
    }
    else {
      LOG && console.log("updating position of delete button ",x,",",y);
      this.deleteButtonModel.set({'position': {'x':x + centerh * trashWidth, 'y':y + centerv * trashHeigth}});

      // refresh intersect
      saIntersect.removeElement("delete");
      registerDeleteIntersect(this.deleteButtonModel);
    }
    //layer.draw();
  }

  function drawBottomTab(that) {
    var layer = that.options.layerBottom;
    var screenPos = that["model"].get("position");
    
    var oldBottomPanelSize = { width: lc.bottomPanelSize.width, y: lc.bottomPanelSize.y };
    
    lc.bottomPanelSize.width = screenPos.width;
    lc.bottomPanelSize.y = screenPos.gridHeight + screenPos.y;
    lc.bottomPanelSize.x = screenPos.x;
    lc.bottomPanelSize.xUsed = 0;

    var forceRedraw = that["model"].get("forceRedraw");

    if (forceRedraw ||
      oldBottomPanelSize.width != lc.bottomPanelSize.width ||
      oldBottomPanelSize.y != lc.bottomPanelSize.y) {

      LOGI && console.log("drawBottomTab!!!!!!");

      that["model"].set({"forceRedraw":false},{"silent":true});

      TLOG && console.log("remove and draw buttomPanel");
      
      removeControls(that, "bottomPanel");

      // capture state of tab Bottom Buttons
      function getSelected(groupID) {

        // todo: this gets always overwritten from the buttonName in the 'model'

        var selected = 0;
        var button =  _.find(that.bottomButtons, function(button) { return button["model"].get("groupID") === groupID});
        if (button) {
          selected = button["model"].get("activeButton");
        }
        LOGI && console.log(" saLayerControls getSelected(",groupID,") = ",selected);
        return selected;
      }
      var activeFilter = getSelected("filter");
      var activeSort = getSelected("sort");

      // remove tab Bottom Buttons
      _.each(that.bottomButtons, function(bottomButton) {
        LOGI && console.log(" saLC, trying to destroy ",bottomButton);
        bottomButton.destroy();
      });

      var bottom_tab;

      bottom_tab = new Kinetic.Shape({
          'drawFunc': function(canvas){
            var context = canvas.getContext();
            context.save();

            var x = lc.bottomPanelSize.x;
            var y = lc.bottomPanelSize.y;
            var w = lc.bottomPanelSize.width;
            var h = lc.bottomPanelSize.height;

            context.beginPath();
            //context.fillRect(x, y, w, h);
            context.rect(x, y, w, h);
            //context.clip();
            //context.fill();
            context.closePath();

            context.fill();
            //A this.fill(context);

            context.restore();
        },
        'fill' : "#1e0e29", //"#1F1F1F",
        'name' : "bottomPanel"
      });

      //LOG && console.log("screenPos:",screenPos," lcbp:",lc.bottomPanelSize);

      layer.add(bottom_tab);
      bottom_tab.moveToBottom(); // make sure its at the bottom - also if other stuff is on the layer.
      layer.draw();

      function createButtonModel (groupID, selectedButtonNr, selectedButtonName, buttonArray) {

        // check if selectedButtonNr and selectedButtonName match, else correct. SelectedButtonName has preference.
        var sb = _.find(buttonArray, function(button) {return button.filterName === selectedButtonName});
        if (sb) {
          var i = _.indexOf(buttonArray, sb);
          if (i >= 0 && i !== selectedButtonNr) {
              selectedButtonNr = i;
          }
          else {
            LOG && console.log("ERROR 1234");
          }
        }
        else {
          LOG && console.log("ERROR 123");
        }

        var _model = new saBottomButton.myButtonsModel({
          position : {
            x: lc.bottomPanelSize.x + lc.bottomPanelSize.xUsed + 10, 
            y: lc.bottomPanelSize.y + 3 + (saBottomButton.buttonPanelHeight - saBottomButton.buttonHeight) / 2
            },
          'groupID' : groupID,
          'buttonArray' : buttonArray,
          'activeButton' : selectedButtonNr,
          'event' : that.options.viewEvent,
          'screenPos' : that["model"].get("position")
        });
        lc.bottomPanelSize.xUsed += saBottomButton.buttonWidth + 10;
        
        return _model;
      }

      var purchaseButton = new saBottomButton.bottomButtonView({
        'model': createButtonModel("filter", activeFilter, that["model"].get("filter"), [
                 {name: "Shops", filterName: "shops"},
                 {name: "All", filterName: "all"},
                 {name: "Purchases", filterName: "purchases"}

               ]),
        layer: layer,
        layerTop: that.options.layerTop
      });
      
      var sortButton = new saBottomButton.bottomButtonView({
        'model': createButtonModel("sort", activeSort, that["model"].get("sort"), [
                 {name: "Stop sorting", filterName: "bynone"},
                 {name: "Sort by date", filterName: "bydate"},
                 {name: "Sort by shop", filterName: "byshop"}
               ]),
        layer: layer,
        layerTop: that.options.layerTop
      });
      
      // keep references to all my buttons
      if (that.bottomButtons) {
        that.bottomButtons.length = 0;
      }
      else {
        that.bottomButtons = [];
      }
      that.bottomButtons.push(purchaseButton);
      that.bottomButtons.push(sortButton);
    }
  }
  
  lc.controlView = Backbone.View.extend({
    'initialize' : function() {

      this.options["model"].bind("change", this.update, this);

      this.update();
    },
  
    update : function() {
      LOG && console.log(" control view update called! active:",this["model"].get("activeLayer"));

      //drawSettings(this);

      drawCircles(this);

      drawArrows(this);

      //drawUsername(this);

      //drawBottomTab(this);

      drawDeleteButton(this);

      this.options.layerBottom.draw();
      this.options.layerTop.draw();
    }
  
  });
  
  return lc;
}());
