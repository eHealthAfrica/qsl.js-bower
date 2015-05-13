# qsl.js

[![Build Status][travis-image]][travis-url]

> QSL parser

QSL is an indentation-significant, outliner-like markup language used to define
questionnaires.

This project is a JavaScript implementation of a QSL parser.

[travis-image]: https://img.shields.io/travis/eHealthAfrica/qsl.js.svg
[travis-url]: https://travis-ci.org/eHealthAfrica/qsl.js

## Usage

`qsl.js` exposes a single function `parse` the takes a raw QSL document and
a section name and returns a formatted representation of the given section.

```yml
# bands.qsl
Favourite bands survey
defaults
  required
section execution order
  bands
bands:
  First gig?
  How many gigs?
    integer
```

```js
'use strict';

var qsl = require('qsl');
qsl.parse(bandsQSL, 'bands');
// =>
// [
//   {
//     label: 'First gig?',
//     name: 'first-gig',
//     type: 'text',
//     required: true
//   },
//   {
//     label: 'How many gigs?',
//     name: 'how-many-gigs',
//     type: 'number',
//     required: true
//   }
// ];
```

## Contributors

* Johannes Wilm <http://www.johanneswilm.org>
* Tom Vincent <https://tlvince.com>

## License

Released under Apache 2.0 license.
