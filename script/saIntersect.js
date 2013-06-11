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
var saIntersect = (function () {
  var my = {};
  var that = this;

  var elements = [];

  /**
   * Register an element
   * @param element
   */
  my.registerElement = function(element) {
    var e = {
      pos: [element.pos.x, element.pos.y],
      id: element.id,
      setHighlight: element.setHighlight,
      removeHighlight: element.removeHighlight
    };
    elements.push(e);

    LOGI && console.log(" element add ",element.id," at ",element.pos.x,",",element.pos.y);
  }

  /**
   * Remove an element by id
   * @param id
   */
  my.removeElement = function(id) {

    var l = elements.length;
    // todo: define functione(e) - not dynamic create it
    elements = _(elements).reject(function(e) { return e.id === id; });

    LOGI && console.log(" removed ",id," times:",l-elements.length);
  }

  /**
   * Check if given item is touching one of the registered elements
   * If so, inform item by callBack and inform the element by callBack
   *
   * @param item (the kinetic group object)
   * @param callBack
   * @param that is optional
   */
  my.dragmove = function(item, callBack, that) {
    if (item.getPosition && callBack) {
      var touchedElement = null;
      var pos = item.getPosition();
      var layer = item.getLayer();
      var yLayerOffset = layer.getPosition().y;

      //pos.y -= yLayerOffset;
      //LOG && console.log(" decreased pos.y by ",yLayerOffset," to:",pos.y);

      //LOGI && console.log(" pos:",pos.x,",",pos.y);

      // todo: consider using layer.getIntersection(pos.x, pos.y) -> thats much faster

      if (item.getAllIntersections) {
        var length = elements.length;
        for (var n=0; n<length; n++) {
          var e = elements[n];
          var pos = [e.pos[0], e.pos[1] + yLayerOffset];
          var i = item.getAllIntersections(pos);
          if (i.length) {
            touchedElement = e;
          }
        }
      }

      if (that) {
        callBack.apply(that, [touchedElement]);
      }
      else {
        callBack(touchedElement);
      }

      // todo: callback element
    }
    else {
      LOGI && console.log("dragmove fail for:",this);
    }
  }

  my.registerElement({pos: {x: 100,y: 250}, id: "cloud9"});

  return my;
}());