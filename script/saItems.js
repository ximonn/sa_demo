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
var saItems = (function () {
  var my = {};

  // todo: for extensions of 'itemModelView' methods are not appropriately added. Consider applying below solution:
  // todo: http://stackoverflow.com/questions/7735133/backbone-js-view-inheritance


  my.itemModelView = Backbone.View.extend({
    'initialize' : function() {

      if (this["model"]) {

        LOG && console.log(" saItem.js initialize");

        this.viewEvent = _.extend({}, Backbone.Events);

        this.viewEvent.on("startDrag", this.startDrag, this);
        this.viewEvent.on("endDrag", this.endDrag, this);

      }
    },

    startDrag : function() {
      this.options.event.trigger("startDrag", this.view.boxgroup);
    },

    endDrag : function() {
      this.options.event.trigger("endDrag", this.view.boxgroup);
    },

    repositionDelayed : function(timeOut) {
      var that = this;
      var id2 = setTimeout(function() {
        LOG && console.log("repositionDelayed - trigger positionMe");
        that.options.event.trigger('positionMe', that);
        clearTimeout(id2);
        id2 = null;
      }, timeOut);
    },

    updateModel : function() {
      LOG && console.log("proto updateModel");
    }
  });

  return my;
}());