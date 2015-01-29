#!/bin/bash
speeddown=$(curl -w "%{speed_download}" -y 60 -Y 100000000000000 -s -o /dev/null http://sycpenops01:5000/download/2mb)
toMBperSecond=$(echo "scale=2; $speeddown/1024/1024" | bc -l)
echo "$toMBperSecond MB/s"
