#!/bin/bash
cd ~/Documents/flexiauto-site
pkill -f "http.server 8080" 2>/dev/null
python3 -m http.server 8080 &>/dev/null &
sleep 1
open http://localhost:8080
