#!/usr/bin/python

# --- short to make a var for inclusion in saImage.js -> use the .svg files as input.

import sys
import re 

fname = sys.argv[1]

fname = re.sub("\.\/","",fname)

with open(fname) as f:
    content = f.readlines()

varname = re.sub("\.svg","Svg",fname)

sys.stdout.write("var "+varname+" = \"")

svg = 0
for textline in content:
    m = re.search("\<svg",textline)
    if m:
      svg = 1

    if svg:
      escapedline = re.sub("\"","\\\"",textline)

      terminatedline = re.sub("\n","\\\n",escapedline)
 
      sys.stdout.write(terminatedline) 

    m = re.search("svg\>",textline)
    if m:
      svg = 0

sys.stdout.write("\";")
print ""
