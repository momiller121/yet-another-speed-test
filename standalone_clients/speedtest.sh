#!/bin/bash
HOST="localhost"
PORT="8080"

   # Up and download use one, small payload to initialize the connection and get past the TCP slow-start, 
   # then use the average of the speed on the last two samples as their value.
DOWN_SIZES="128kb 512kb 1MB"    # Download values - see http://_____/download/config
UP_SIZES="32 256 512"           # Upload sizes in kiloBytes, NUMBER ONLY

DEBUG="off"

   # Fetch IP address from /myip and print them out as zero-padded octets.
FINGERPRINT=$(curl --silent http://${HOST}:${PORT}/myip | awk -F\" '{print $4;}' | awk -F. '{printf "%03d%03d%03d%03d", $1, $2, $3, $4};')

   # Ping the host ten times and get the average.
[ $DEBUG == "on" ] && echo "Pinging ${HOST}..."
ping_avg=$( ping -c 10 $HOST | tee /tmp/latency.$$ | awk -F/ '/packet loss/{x="Loss:" $0} /round-trip/{x=$5} END{print x}' )
if [ $DEBUG == "on" ] ; then
   echo "=== Ping ==="
   cat /tmp/latency.$$
   echo "Ping Avg:   $ping_avg ms"
fi

   # Do the pseudo-latency image fetch ten times, take time_connect from curl, throw out min/max and average the rest.
latency=$(for i in 0 1 2 3 4 5 6 7 8 9 ; do
   curl -w "%{time_connect}\n" -s -o /dev/null http://${HOST}:${PORT}/blank.gif ; done \
     | tee /tmp/latency.$$ \
     | awk 'BEGIN { sum = max = n = 0 ; min = 999 ; } 
            { if ($1 < min) { min = $1 } if ( $1 > max) { max = $1 } sum = sum + $1 ; n++ } 
            END { printf "%.1f", (sum-min-max)/(n-2)*1000 }' )

if [ $DEBUG == "on" ] ; then
   echo "=== Latency ==="
   cat /tmp/latency.$$
   echo "Latency: $latency"
fi

   # For each download, we need a "-o /dev/null" for output and the URL of the download
o="" ; urls=""
for s in $DOWN_SIZES; do
   o="${o} -o /dev/null"     # Send all our output straight to /dev/null
   urls="${urls} http://${HOST}:${PORT}/download/${s}" # Build a list of URLs to hit
done

    # Do the downloads, take the speed from the last two and average them as our download speed.
down=$(curl -w "%{speed_download} Size: %{size_download} TimeTotal: %{time_total}\n" --silent ${o} ${urls} \
     | tee /tmp/download.$$ \
     | awk 'BEGIN { n1=n2=0 }
            { n1=n2; n2=$1 }
            END { printf "%.1f", (n1+n2)/2/1024 }' )

if [ $DEBUG == "on" ] ; then
   echo "=== Download ==="
   cat /tmp/download.$$
   echo "Download: $down"
fi

    # Do the uploads, take the speed from the last two and average them as our upload speed.
up=$( for s in $UP_SIZES; do
   dd if=/dev/urandom bs=1024 count=${s} 2> /dev/null \
   | curl "http://${HOST}:${PORT}/upload" -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' \
          -w "%{speed_upload} Size: %{size_upload}\n" -o /dev/null --silent --data-binary @-  \
   ; done \
   | tee /tmp/upload.$$ \
   | awk 'BEGIN { n1=n2=0 }
          { n1=n2; n2=$1 }
          END { printf "%.1f", (n1+n2)/2/1024 }' )

if [ $DEBUG == "on" ] ; then
   echo "=== Upload ==="
   cat /tmp/upload.$$
   echo "Upload: $up"
fi

   # Post the results back to the server so they can be logged.
curl "http://${HOST}:${PORT}/results" -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' \
     -o /tmp/results.$$ --silent -H 'Accept: */*' --compressed \
     --data "fingerprint=${FINGERPRINT}&latency=${latency}&download=${down}&upload=${up}" 

[ $DEBUG == "on" ] && cat /tmp/results.$$ &&  echo

   # Clean up temp files
rm /tmp/latency.$$ /tmp/download.$$ /tmp/upload.$$ /tmp/results.$$

