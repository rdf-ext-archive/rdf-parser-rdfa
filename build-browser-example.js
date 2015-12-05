var browserify = require('browserify')
var fs = require('fs')
var path = require('path')

browserify('./example/example.js').bundle().pipe(fs.createWriteStream('./example/support/example.js'))
