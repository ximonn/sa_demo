#!/bin/bash

find . -iname "*.svg" -type f  | xargs -n 1 ./prepsvgforjs.py
