sa_demo
=======

ShopAunt dynamic grid - based on kineticjs and backbone

see https://www.shopaunt.com/sa_demo/sa_demo.html

Basic concept:
saDemo.js is the main file, it creates a model collection to be represented by views on the canvas.
saGridView.js contains the logic for the grid (which position a view should be, how many fit on the grid, etc.)
saItemView.js contains general view functionality, assuming a view always contains an image.
saDemoView.js draws the view based on its model, when a parameter in the model changes, its update function is triggered.

The demo adds a set of 8 models to the collection, then on an interval basis a new model is added and the oldest is removed.

Disclaimer:
* This is a proof of concept, code is not cleaned up and contains lots of stuff which is not needed for the demo - e.g.:
* saImage.js - contains a basic svg parser - to dynamically create kineticjs objects out of svg data (you can use it to prevent (workaround?) cross origin security issues in the browser which you might get if you use svg files directly).
* saButton.js - to create a button on the canvas which reacts to mouse over events.

Notes:
* You can use closure compiler to create a single small js file, e.g.:
  java -jar /usr/local/google/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS  --js ./script/saGeneral.js --js ./script/saIntersect.js --js ./script/saLayers.js --js ./script/saImage.js --js ./script/saButton.js --js ./script/saBackground.js --js ./script/saItemView.js --js ./script/saDemoView.js --js ./script/saBottomButton.js --js ./script/saLayerControls.js --js ./script/saGridView.js --js ./script/saItems.js --js ./script/saDemo.js --externs ./externs/externs.js --externs ./externs/externs_backbone.js --externs ./externs/externs_kinetic.js --js_output_file ./script/sademo.js

