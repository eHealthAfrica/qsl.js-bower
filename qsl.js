(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.qsl = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

exports.parse = function(rawQSL) {
  var rawLines = rawQSL.split('\n');
  var cleanedLines = [];
  var parsedLines = [];
  var indentationLength = 0;
  var error = false;
  var i = 0;

  // Remove comments and empty lines
  rawLines.forEach(function(rawLine) {
    var lineWoComment = rawLine.split('#')[0].trimRight();
    if (lineWoComment.trim().length > 0) {
      cleanedLines.push(lineWoComment);
    }
  });

  // Find indentation length
  while (indentationLength === 0 && i < cleanedLines.length) {
    if (cleanedLines[i].length - cleanedLines[i].trimLeft().length > 0) {
      indentationLength = cleanedLines[i].length - cleanedLines[i].trimLeft().length;
    }
    i++;
  }

  // Don't allow indentations of zero
  if (indentationLength === 0) {
    indentationLength = 1;
  }

  // Turn Python into a construct of Arrays and Objects
  cleanedLines.forEach(function(cleanedLine) {
    var indentations = (cleanedLine.length - cleanedLine.trimLeft().length) / indentationLength,
      currentArray = parsedLines,
      j;


    if (indentations % 1 !== 0) {
      // indentation characters do not correspond to a known indentation level.
      error = true;
    }

    for (j = 0; j < indentations; j++) {
      if (currentArray.length === 0) {
        // The indentations tell us to go a place that it's not possible to go.
        error = true;
      } else {
        currentArray = currentArray[currentArray.length - 1].children;
      }
    }
    currentArray.push({
      key: cleanedLine.trimLeft(),
      children: []
    });
  });

  if (error) {
    console.warn('Python formatting with errors!');
  }

  return parsedLines;
};

},{}],2:[function(require,module,exports){
'use strict';

module.exports = require('./lib/qsl');

},{"./lib/qsl":1}]},{},[2])(2)
});