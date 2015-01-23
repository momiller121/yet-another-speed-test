yet-another-speed-test
======================

Browser / Node.js (server side) based speed test with a focus on support for IE6. 

> The primary goal of the project is to create a simple (yes, even naive) speed test that is suitable to run within an
> an internal network. Instead of focusing on the validity of the numeric data produced by the client(s)
> the effort is to support the ability to trend (over time) the relative client perspective of network performance.

To install:

git clone then cd to yet-another-speed-test

```sh
$ npm install
```
```sh
$ npm start
```

Browse to http://127.0.0.1:5000
(before you can reach the test from elsewhere, edit authorizedRanges in config.js)

