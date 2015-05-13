(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.qsl = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var slug = require('to-slug-case');

var types = require('./types');

function isInclusion(row) {
  return row.key.charAt(0) === '['
    && row.key.charAt(row.key.length - 1) === ']';
}

function getInclusion(row) {
  return row.key.slice(1, -1);
}

function knownType(row) {
  if (!row.children.length) {
    // Default to 'text' type, sans constraints
    row.children = [
      {
        key: 'text',
        children: []
      }
    ];
  }
  return row.children[0].key in types;
}

function collateEnumerations(enumeable) {
  function collate(enumerate) {
    return {
      label: enumerate.key,
      value: slug(enumerate.key)
    };
  }
  return enumeable.map(collate);
}

function appendDefaults(defaults, section) {
  // Currently, only the `required` default can be set
  // https://github.com/eHealthAfrica/qsl#the-defaults-section
  var required = defaults.children[0];
  if (!(required && required.key && required.key === 'required')) {
    return section;
  }
  section.required = true;
  return section;
}

function pluckSection(sections, section) {
  // Questionnaire sections have a colon suffix
  section += ':';
  section = sections[section];
  if (!section) {
    return {};
  }
  return section;
}

function indexByKey(qsl) {
  function byKey(accumilator, section) {
    if (!section.key) {
      return accumilator;
    }
    accumilator[section.key] = section;
    return accumilator;
  }
  return qsl.reduce(byKey, {});
}

function parseSection(index, section) {
  section = pluckSection(index, section);
  if (index.defaults) {
    section = appendDefaults(index.defaults, section);
  }

  if (!(section && section.children)) {
    return [];
  }

  var elements = [];

  function pushInclusion(inclusion) {
    elements.push(inclusion);
  }

  function createElement(row) {
    if (isInclusion(row)) {
      var inclusion = getInclusion(row);
      var inclusions = parseSection(index, inclusion);
      inclusions.forEach(pushInclusion);
      return;
    }

    var element = {
      label: row.key,
      name: slug(row.key)
    };

    var key = row.children[0].key;
    var map = types[key];

    element.type = map.type;
    if (map.options) {
      element.fields = map.options;
    }

    if (section.required) {
      element.required = true;
    }

    var children = row.children[0].children;
    if (!children.length) {
      elements.push(element);
      return;
    }

    if (key === 'enumeration') {
      element.fields = collateEnumerations(children);
    }

    if (children[0].key && children[0].key === 'optional') {
      element.required = false;
    }

    elements.push(element);
  }

  section.children
    .filter(knownType)
    .forEach(createElement);

  return elements;
}

exports.format = function(qsl, section) {
  var index = indexByKey(qsl);
  return parseSection(index, section);
};

},{"./types":3,"to-slug-case":4}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
'use strict';

/**
 * Maps QSL data types with templates containing appropriate HTML form elements.
 */
module.exports = {
  text: {
    type: 'text'
  },
  integer: {
    type: 'number',
    step: 1,
    min: 0
  },
  real: {
    type: 'number'
  },
  date: {
    type: 'date'
  },
  time: {
    type: 'time'
  },
  datetime: {
    type: 'datetime'
  },
  gps: {
    type: 'number'
  },
  enumeration: {
    type: 'radio',
    options: []
  },
  'yes/no': {
    type: 'yes/no',
    options: [
      {
        label: 'Yes',
        value: 'Y'
      },
      {
        label: 'No',
        value: 'N'
      }
    ]
  },
  gender: {
    type: 'gender',
    options: [
      {
        label: 'Male',
        value: 'M'
      },
      {
        label: 'Female',
        value: 'F'
      }
    ]
  }
};

},{}],4:[function(require,module,exports){

var toSpace = require('to-space-case');


/**
 * Expose `toSlugCase`.
 */

module.exports = toSlugCase;


/**
 * Convert a `string` to slug case.
 *
 * @param {String} string
 * @return {String}
 */


function toSlugCase (string) {
  return toSpace(string).replace(/\s/g, '-');
}
},{"to-space-case":5}],5:[function(require,module,exports){

var clean = require('to-no-case');


/**
 * Expose `toSpaceCase`.
 */

module.exports = toSpaceCase;


/**
 * Convert a `string` to space case.
 *
 * @param {String} string
 * @return {String}
 */


function toSpaceCase (string) {
  return clean(string).replace(/[\W_]+(.|$)/g, function (matches, match) {
    return match ? ' ' + match : '';
  });
}
},{"to-no-case":6}],6:[function(require,module,exports){

/**
 * Expose `toNoCase`.
 */

module.exports = toNoCase;


/**
 * Test whether a string is camel-case.
 */

var hasSpace = /\s/;
var hasCamel = /[a-z][A-Z]/;
var hasSeparator = /[\W_]/;


/**
 * Remove any starting case from a `string`, like camel or snake, but keep
 * spaces and punctuation that may be important otherwise.
 *
 * @param {String} string
 * @return {String}
 */

function toNoCase (string) {
  if (hasSpace.test(string)) return string.toLowerCase();

  if (hasSeparator.test(string)) string = unseparate(string);
  if (hasCamel.test(string)) string = uncamelize(string);
  return string.toLowerCase();
}


/**
 * Separator splitter.
 */

var separatorSplitter = /[\W_]+(.|$)/g;


/**
 * Un-separate a `string`.
 *
 * @param {String} string
 * @return {String}
 */

function unseparate (string) {
  return string.replace(separatorSplitter, function (m, next) {
    return next ? ' ' + next : '';
  });
}


/**
 * Camelcase splitter.
 */

var camelSplitter = /(.)([A-Z]+)/g;


/**
 * Un-camelcase a `string`.
 *
 * @param {String} string
 * @return {String}
 */

function uncamelize (string) {
  return string.replace(camelSplitter, function (m, previous, uppers) {
    return previous + ' ' + uppers.toLowerCase().split('').join(' ');
  });
}
},{}],7:[function(require,module,exports){
'use strict';

var parser = require('./lib/parse');
var formatter = require('./lib/format');

exports.parse = parser.parse;
exports.format = formatter.format;

},{"./lib/format":1,"./lib/parse":2}]},{},[7])(7)
});