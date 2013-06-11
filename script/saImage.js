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
 * NOTES on "no image antialiasing in Kinetic.Image with custom width/height"
 *
 * issue: https://github.com/ericdrowell/KineticJS/issues/233#issuecomment-12405404
 *
 *
 * WEBGL live demo:
 * http://evanw.github.com/webgl-filter/
 *
 * WEBGL image processing lib:
 * http://evanw.github.com/glfx.js/
 *
 * Hi DPI
 * http://www.html5rocks.com/en/tutorials/canvas/hidpi/
 *
 */



var saImage = (function (_id) {
  var my = {};
  var that = this;
  
  // *********** images ***********************
  my.Model = Backbone.Model.extend({
    // Default attributes for the envelopeModel item.
    'defaults' : function() {
      return {
        'name' : "",
        'image' : new Image(),
        'loaded' : false
      };
    },

    'initialize' : function() {

    },

    // Remove this stuff from *localStorage* and delete its view.
    'clear' : function() {
      this.destroy();
    }
  });

  my.Collection = Backbone.Collection.extend({

    'model' : my.Model,
    
    event : null,
    
    thisCheck : "my.Collection",
    
    loadCount : 0, // nr of images that are loaded
    openCount : 0, // nr of images that are initialized (opened)

    'initialize' : function() {
      this.event = _.extend({}, Backbone.Events);
    },
  
    setLayer : function(layer) {
      this.layer = layer;
      if (this.thisCheck) {
        
      }
      else {
        console.log(" ERROR: this is not my.Collection");
      }
    },
    
    allLoaded : function() {
      // todo: remove thisCheck
      if (this.thisCheck) {
        
      }
      else {
        console.log(" ERROR: this is not my.Collection");
      }
      
      return ((this.loadCount === this.openCount) ? true : false);
    },

    getModelByName : function(imageName) {
      var imageModel = _.find(this["models"], function(image) {return image.get("name") === imageName;});
      return imageModel;
    },

    getByName : function(imageName) {
      var imageModel = _.find(this["models"], function(image) {return image.get("name") === imageName;});
      
      if (imageModel) {
        image = imageModel.get("image");
      }
      else {
        image = null;
      }
      
      return image;
    }
    
    //localStorage : new Store("sa-backbone-images"),
  });
  
  my.initAnyImage = function(imageName, imageSrc) {
    // make src into full URL - to satisfy security risk of stealing local files as svg and reading out contents
	var hostUrl = window.location.protocol + "//" + window.location.host + "/";
	imageSrc = hostUrl+"sa_demo/"+imageSrc;
	
	LOG && console.log("imageName:",imageName," -> ",imageSrc);
	
    var model = new my.Model({ 'name' : imageName });
    
    var image = model.get("image");

    image.src = imageSrc;
    image.onload = function() {
      LOG && console.log("image loaded: ",image," width:",this.width," height:",this.height);
      // trigger change

      var that = this;

      // image.complete check = workaround for issue: https://bugzilla.mozilla.org/show_bug.cgi?id=574330
      // image.complete check is also needed in chrome 28 - onload might be called before image.complete is set, in that case img width and height might not be available.

      function updateModel() {
        if (!image.complete) {
          setTimeout(updateModel, 100);
        }
        else {
          var width = that.width;
          var height = that.height;
          if (!width || !height) {
            // really not complete,..
            //   not sure if I can ever get here
            console.log(" error: no image width or height");
            setTimeout(updateModel, 200);
          }
          else {
            model.set({ 'loaded' : true, 'width': width, 'height': height });
          }
        }
      }

      updateModel();
    };
    // todo: clean up dynamically creating functions here - define function first then use the defined function ref.
    image.onerror = function() {
      // retry once
      if (!model.get('retried')) {
        LOG && console.log("Error loading image "+imageName);
        model.set({'retried':true},{'silent':true});
        
        // wait a bit and try again
        // todo: check timeout time - to optimize it for typical network latency
        var id = setTimeout(function() {
              image.src = imageSrc;
              clearTimeout(id);
            }, 20);
      }
      else {
        LOG && console.log("Error on retry for image "+imageName);
        
        image.src = '/img/s/empty.png';

        /*image.src = 'data:image/png;base64,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\
        KzAxOjAwJovsiQAAAABJRU5ErkJggg==';
        */

        // todo: use the svg instead of png version, or generated the bitmap image from the svg.
        //image = saImage.getSVG('new_shopSvg', 172, 171);
        /*model.set({
          'width': 132,
          'height': 132
        }, {'silent':true});
        */

        /*model.set({
          'unavailable':true,
          'image':image,
          'loaded' : true,
          'width': 132,
          'height': 132
        },{'silent':false});*/
      }
    };

    LOG && console.log("image: ", image);
    return model;
  };
  
  my.initImage = function(theCollection, imageName, imageSrc) {

    if (imageName == "bol") {
      LOG && console.log("loading bol");
    }
    // does it exist already? (imageName is unique!)
    var model = _.find(theCollection["models"], function(model) {return model.get("name") === imageName;});

    if (!model) {
      model = my.initAnyImage(imageName, imageSrc);
      //saImages.add(model);
      theCollection.add(model);

      theCollection.openCount++;
      LOG && console.log("theCollection.openCount:",theCollection.openCount,"  vs loadCount:",theCollection.loadCount);

      function checkAllLoaded(theCollection) {
        theCollection.loadCount++;
        LOG && console.log("theCollection.loadCount:",theCollection.loadCount,"   vs openCount:",theCollection.openCount);

        if (theCollection.loadCount === theCollection.openCount) {
          LOG && console.log(" initImage: all Loaded ");
          theCollection.event.trigger("allLoaded");
        }
      }

      // bind change, e.g. caused by image src finished loading, to redraw
      model.bind("change", function() {
        checkAllLoaded(theCollection);
        if (theCollection.layer) {
          LOG && console.log(" initImage: image loaded, redraw");
          theCollection.layer.draw();
        }
      }, this);
    }

    return model;
  };

  my.getScale = function(x1,y1,x2,y2) {
    var scaleX = x1 / x2;
    var scaleY = y1 / y2;
    // use smallest, so item will fit within width/height frame
    var scale = scaleX < scaleY ? scaleX : scaleY;
    return scale;
  }

  my.positionAndScaleImage = function(kineticImage, imageModel, bPos, maxWidth, maxHeight) {
    var width = imageModel.get('width');
    var height = imageModel.get('height');

    if (width !== maxWidth || height !== maxHeight) {

      scale = my.getScale(maxWidth, maxHeight, width, height);

      /*if (width > height) {
        scale = width / maxWidth;
        if (height / scale > maxHeight) {
          scale = height / maxHeight;
        }
      }
      else {
        scale = height / maxHeight;
        if (width / scale > maxWidth) {
          scale = width / maxWidth;
        }
      }
      */

      // prevent zooming in past pixel
      //if (scale < 1) {
      //  scale = 1;
      //}

      width = width * scale;
      height = height * scale;

      if (width < maxWidth) {
        bPos.x += (maxWidth - width) / 2;
      }
      if (height < maxHeight) {
        bPos.y += (maxHeight - height) / 2;
      }
    }



    kineticImage.setWidth(width);
    kineticImage.setHeight(height);
    // center if image is smaller then 200x200

    kineticImage.setPosition(bPos.x, bPos.y);
  }

  // get image by name from collection
  /*my.get = function(theCollection, imageName) {
    var imageModel = _.find(theCollection["models"], function(image) {return image.get("name") === imageName;});
    
    if (imageModel) {
      image = imageModel.get("image");
    }
    else {
      image = null;
    }
    
    return image;
  };*/


  // prepare xml parser
  var parseXml;
  if (typeof window.DOMParser != "undefined") {
    parseXml = function (xmlStr) {
      return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
    };
  } else if (typeof window.ActiveXObject != "undefined" &&
    new window.ActiveXObject("Microsoft.XMLDOM")) {
    parseXml = function (xmlStr) {
      var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
      xmlDoc.async = "false";
      xmlDoc.loadXML(xmlStr);
      return xmlDoc;
    };
  } else {
    throw new Error("No XML parser found");
  }

  // limited svg support - e.g. use Inkscape to make some basic shapes (filled elements, not using strokes etc).

  var blackcircleSvg = "<svg version=\"1.0\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\
    width=\"72.953px\" height=\"72.391px\" viewBox=\"0 0 72.953 72.391\" enable-background=\"new 0 0 72.953 72.391\" xml:space=\"preserve\">\
    <g>\
      <ellipse cx=\"36.477\" cy=\"36.195\" rx=\"36.477\" ry=\"36.196\"/>\
    </g></svg>";

  var pentagramSvg = "<svg xmlns=\"http://www.w3.org/2000/svg\"\
    width=\"304\" height=\"290\">\
    <path fill=\"#12B92F\" d=\"M2,111 h300 l-242.7,176.3 92.7,-285.3 92.7,285.3 z\"/>\
    </svg>";

  function createPath(item, width, height, scale) {
    LOG && console.log(" createPath:",item);

    if (!scale) {
      scale = 1;
    }
    //todo: check why item.width and item.height is not always given..
    if (width && height && item.width && item.height) {
      var scaleX = width / item.width;
      var scaleY = height / item.height;
      // use smallest, so item will fit within width/height frame
      scale = scaleX < scaleY ? scaleX : scaleY;
    }
    else {
      // this bit seems useless: (lets remove it):
      if (!width) {
        width = item.width;
      }
      if (!height) {
        height = item.height;
      }
    }
    var path = new Kinetic.Path({
      'x':0,
      'y':0,
      'data':item.data,
      'fill':item.fill,
      'scale':scale
    });
    return path;
  }



  function createGroupedPath(data, width, height, scale) {
    var pData = parseXml(data);
    LOGSVG && console.log(" createGroupedPath:", pData);

    // keep numeric chars and '.' -> convert to float numbers
    var pWidth = pData.documentElement.getAttribute("width");
    pWidth = pWidth.replace(/![^\d\.]+/g, '');
    pWidth = parseFloat(pWidth);
    var pHeight = parseFloat(pData.documentElement.getAttribute("height").replace(/![^\d\.]+/g, ''));

    if (!scale) {
      scale = 1;
    }
    if (width && height) {

      scale = my.getScale(width, height, pWidth, pHeight);

      LOGSVG && console.log(" scaleinfo pW:",pWidth," pH:",pHeight," w:",width," h:",height," scaleX:",scaleX," scaleY:",scaleY);
    }
    else {
      if (!width) {
        width = pWidth;
      }
      if (!height) {
        height = pHeight;
      }
    }

    var pGroup = new Kinetic.Group({
      'name':"pGroup",
      'x':0,
      'y':0,
      'width':width,
      'height':height,
      'pWidth':pWidth,
      'pHeight':pHeight
    });

    // svg
    //  g
    //    path & fill
    //    path & fill
    //    ..
    //  /g
    //  g
    //    path & fill
    //    path & fill
    //    ..
    //  /g
    // /svg

    // <g>


    function walkChildNodes(childNodes, trail) {
      var length = childNodes.length;
      var n = 0;

      for (n = 0; n < length; n++) {
        LOGSVG && console.log("n:",n," length:",length);
        var child = childNodes[n];

        if ((child.tagName == "g" || child.tagName == "svg") && child.hasChildNodes()) {
          trail += "."+child.tagName
          LOGSVG && console.log("trail:",trail," children:",child.childNodes.length);

          walkChildNodes(child.childNodes, child.tagName);
        }
        else if (child.getAttribute) {
          LOGSVG && console.log(" trail:",trail," looking at child nr:",n," of ",length);
          var fillColor = child.getAttribute("fill");
          if (!fillColor) fillColor = "#000";

          if (child.tagName == "path") {
            LOGSVG && console.log(" found path:", child);

            var d = child.getAttribute("d");

            //fill-rule=\"evenodd\" clip-rule=\"evenodd\"
            var attributes = {};
            attributes.fill_rule = child.getAttribute("fill-rule");
            attributes.clip_rule = child.getAttribute("clip-rule");

            // remove white space
            d = d.replace(/\s+/g, ' ');

            var path = createPath({data:d, fill:fillColor, attributes:attributes }, width, height);

            pGroup.add(path);
          }
          else if (child.tagName == "rect") {
            // <rect x=\"0\" y=\"57.496\" fill=\"#FFFFFF\" width=\"199.489\" height=\"117.031\"/>
            LOGSVG && console.log(" found rect:", child);

            var x = parseFloat(child.getAttribute("x"));
            var y = parseFloat(child.getAttribute("y"));
            var w = parseFloat(child.getAttribute("width"));
            var h = parseFloat(child.getAttribute("height"));

            x = isNaN(x) ? 0 : x;
            y = isNaN(y) ? 0 : y;
            w = isNaN(w) ? 0 : w;
            h = isNaN(h) ? 0 : h;

            var rect = new Kinetic.Rect({
              'x': x,
              'y': y,
              'width': w,
              'height': h,
              'fill': fillColor
            });

            pGroup.add(rect);
          }
          else if (child.tagName == "polygon") {
            LOGSVG && console.log(" found polygon:", child);
            //<polygon fill=\"#ECEDED\" points=\"99.747,114.993 199.49,57.496 0,57.496 \"/>\

            var points = child.getAttribute("points");

            // remove white space at the end
            points = points.replace(/[\s]+$/, '');

            // remove white space at start
            points = points.replace(/^[\s]+/, '');

            // replace white space in between to ','
            points = points.replace(/[\s]+/g, ',');

            var pArr = points.split(',');

            // convert string values to numbers
            var pArrLength = pArr.length;
            for (var i=0; i < pArrLength; i++) {
              var val = parseFloat(pArr[i]);
              pArr[i] = isNaN(val) ? 0 : val;
            }

            var poly = new Kinetic.Polygon({
              'points': pArr,
              'fill': fillColor
            });

            pGroup.add(poly);
          }
          else if (child.tagName == "ellipse") {
            LOGSVG && console.log(" found ellipse:", child);
            //<ellipse cx=\"36.476\" cy=\"36.195\" rx=\"36.476\" ry=\"36.196\"/>\

            var cx = parseFloat(child.getAttribute("cx"));
            var cy = parseFloat(child.getAttribute("cy"));
            var rx = parseFloat(child.getAttribute("rx"));
            var ry = parseFloat(child.getAttribute("ry"));

            cx = isNaN(cx) ? 0 : cx;
            cy = isNaN(cy) ? 0 : cy;
            rx = isNaN(rx) ? 0 : rx;
            ry = isNaN(ry) ? 0 : ry;

            // kinetic v4.5.3 removed ellipse, with v4.5.4 its back
            /*var scaleX = 1;
            var scaleY = 1;
            var radius;
            if (rx > ry) {
              scaleX = rx/ry;
              radius = ry;
            }
            if (ry > rx) {
              scaleY = ry/rx;
              radius = rx;
            }*/

            var ellipse = new Kinetic.Ellipse({ //new Kinetic.Circle({
              'x': cx,
              'y': cy,
              'radius': {'x':rx,'y':ry},
              //'scaleX':scaleX,
              //'scaleY':scaleY,
              'fill': fillColor
            });

            pGroup.add(ellipse);
          }
          else {
            LOGSVG && console.log(" trail: ",trail," child:",child," is unsupported type:",child.tagName);
          }
        }
        else {
          LOGSVG && console.log(" trail: ",trail," child has no attributes:",child);
        }
      }

      LOGSVG && console.log("exiting n:",n," length:",length);
    }

    //walkChildNodes(pData.documentElement.childNodes);
    walkChildNodes(pData.childNodes, "");

    LOGSVG && console.log(" setting scale:",scale);

    pGroup.setScale({x:scale, y:scale});

    return pGroup;
  }



  var _svgShapes = {};

  function createSvgShape(name, data, width, height) {
    var shape = null;
    if (_svgShapes[name]) {
      try {
        shape = _svgShapes[name].clone();

        var scale = my.getScale(width, height, shape['attrs']['pWidth'], shape['attrs']['pHeight']);
        shape.setScale({x:scale, y:scale});
      }
      catch(err) {
        // oops something goes wrong?! just cook a new one!
        //shape = null;
      }
    }
    if (!shape) {
      shape = createGroupedPath(data, width, height);
      // create private clone, shape itself may get mollested (children killed) by caller
      _svgShapes[name] = shape.clone();
    }
    return shape;
  }

  my.getSVG = function(svgID, width, height) {
    var svgShape = null;

    switch(svgID) {

      case 'pentagram.svg' : svgShape = createSvgShape('pentagramSvg', pentagramSvg, width, height);
        break;

      default:
        svgShape = createSvgShape('blackcircleSvg', blackcircleSvg, width, height);
    }

    return svgShape;
  }

  // in case you want to rotate the svg
  // todo: make this work for createPath generated shapes as well -> fix createPath()
  my.centerSVG = function(svgShape){
    // set x,y to center of drawWindow
    var x = (svgShape['attrs']['pWidth']/2);
    var y = (svgShape['attrs']['pHeight']/2);
    var scale = undefined;

    var children = svgShape.getChildren();
    var l = children.length;
    var childPos;
    for(var n=0; n<l; n++) {
      var child = children[n];
      // all children are on same scale
      if (!scale) {
        scale = child['attrs']['scale'];
        x = x*scale.x;
        y = y*scale.y;
        childPos = {x:-x, y:-y};
      }
      child.setPosition(childPos);
    }

    return svgShape;
  }

  // -------------------conversion------------------------------
  // ---------------- rgb | hsl | hsv --------------------------

  my.rgbToHsv = function(r, g, b) {
    var computedH = 0;
    var computedS = 0;
    var computedV = 0;

    //remove spaces from input RGB values, convert to int
    var r = parseInt(('' + r).replace(/\s/g, ''), 10);
    var g = parseInt(('' + g).replace(/\s/g, ''), 10);
    var b = parseInt(('' + b).replace(/\s/g, ''), 10);

    if (r == null || g == null || b == null ||
      isNaN(r) || isNaN(g) || isNaN(b)) {
      alert('Please enter numeric RGB values!');
      return;
    }
    if (r < 0 || g < 0 || b < 0 || r > 255 || g > 255 || b > 255) {
      alert('RGB values must be in the range 0 to 255.');
      return;
    }
    r = r / 255;
    g = g / 255;
    b = b / 255;
    var minRGB = Math.min(r, Math.min(g, b));
    var maxRGB = Math.max(r, Math.max(g, b));

    // Black-gray-white
    if (minRGB == maxRGB) {
      computedV = minRGB;
      return [0, 0, computedV];
    }

    // Colors other than black-gray-white:
    var d = (r == minRGB) ? g - b : ((b == minRGB) ? r - g : b - r);
    var h = (r == minRGB) ? 3 : ((b == minRGB) ? 1 : 5);
    computedH = 60 * (h - d / (maxRGB - minRGB));
    computedS = (maxRGB - minRGB) / maxRGB;
    computedV = maxRGB;
    return [computedH, computedS, computedV];
  }

  my.hsvToRgb = function(h, s, v) {
    var r, g, b;
    var i;
    var f, p, q, t;

    // Make sure our arguments stay in-range
    h = Math.max(0, Math.min(360, h));
    s = Math.max(0, Math.min(100, s));
    v = Math.max(0, Math.min(100, v));

    // We accept saturation and value arguments from 0 to 100 because that's
    // how Photoshop represents those values. Internally, however, the
    // saturation and value are calculated from a range of 0 to 1. We make
    // That conversion here.
    s /= 100;
    v /= 100;

    if (s == 0) {
      // Achromatic (grey)
      r = g = b = v;
      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    h /= 60; // sector 0 to 5
    i = Math.floor(h);
    f = h - i; // factorial part of h
    p = v * (1 - s);
    q = v * (1 - s * f);
    t = v * (1 - s * (1 - f));

    switch (i) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;

      case 1:
        r = q;
        g = v;
        b = p;
        break;

      case 2:
        r = p;
        g = v;
        b = t;
        break;

      case 3:
        r = p;
        g = q;
        b = v;
        break;

      case 4:
        r = t;
        g = p;
        b = v;
        break;

      default: // case 5:
        r = v;
        g = p;
        b = q;
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  my.hslToRgb = function(h, s, l) {
    var r, g, b;

    if (s == 0) {
      r = g = b = l; // achromatic
    } else {
      function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      }

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [r * 255, g * 255, b * 255];
  }

  my.rgbToHsl = function(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
      h = s = 0; // achromatic
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return [h, s, l];
  }

  return my;
}());