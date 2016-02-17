var rdf = require('rdf-ext')
var inherits = require('inherits')
var DomParser = require('rdf-parser-dom')
var RDFaProcessor = require('green-turtle').RDFaProcessor

var RdfaParser = function () {
  DomParser.call(this, rdf)
}

inherits(RdfaParser, DomParser)

RdfaParser.prototype.process = function (data, callback, base, filter, done) {
  var self = this

  return new Promise(function (resolve, reject) {
    base = base || 'http://localhost/'
    filter = filter || function () { return true }
    done = done || function () {}

    try {
      var blankNodeMap = {}

      var createNode = function (value) {
        if (!value) {
          return null
        }

        if (typeof value === 'string') {
          if (value.substring(0, 2) === '_:') {
            if (!(value in blankNodeMap)) {
              blankNodeMap[value] = rdf.createBlankNode()
            }

            return blankNodeMap[value]
          } else {
            return rdf.createNamedNode(value)
          }
        } else {
          if (value.type === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#HTML') {
            if (value.value.length === 0) {
              return rdf.createLiteral('', null, rdf.createNamedNode(value.type))
            }

            return rdf.createLiteral(value.value[0].parentNode.textContent, value.language, rdf.createNamedNode(value.type))
          }

          if (value.type === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#object') {
            return createNode(value.value)
          } else {
            var datatype = createNode(value.type)

            return rdf.createLiteral(value.value, value.language, datatype)
          }
        }
      }

      var processor = new RDFaProcessor()

      processor.finishedHandlers.push(
        function () {
          done()
          resolve()
        }
      )

      processor.addTriple = function (greenOrigin, greenSubject, greenPredicate, greenObject) {
        var subject = createNode(greenSubject)
        var predicate = createNode(greenPredicate)
        var object = createNode(greenObject)

        if (subject && predicate && object) {
          var triple = rdf.createTriple(subject, predicate, object)

          if (filter(triple)) {
            callback(triple)
          }
        }
      }

      if (typeof data === 'string') {
        data = self.parseHtmlDom(data, base)
      }

      processor.process(data, {baseURI: base})
    } catch (error) {
      done(error)
      reject(error)
    }
  })
}

// add singleton methods to class
var instance = new RdfaParser()

for (var property in instance) {
  RdfaParser[property] = instance[property]
}

module.exports = RdfaParser
