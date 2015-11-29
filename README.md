[npm-image]: http://img.shields.io/npm/v/mongoose-to-object-project.svg
[npm-url]: https://npmjs.org/package/mongoose-to-object-project
[downloads-image]: https://img.shields.io/npm/dm/mongoose-to-object-project.svg
[downloads-url]: https://npmjs.org/package/mongoose-to-object-project
[dependency-image]: https://gemnasium.com/Faleij/mongoose-toObject-project.svg
[dependency-url]: https://gemnasium.com/Faleij/mongoose-toObject-project
[travis-image]: https://travis-ci.org/Faleij/mongoose-toObject-project.svg?branch=master
[travis-url]: https://travis-ci.org/Faleij/mongoose-toObject-project
[coveralls-image]: https://coveralls.io/repos/Faleij/mongoose-toObject-project/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/Faleij/mongoose-toObject-project?branch=master
[gratipay-image]: https://img.shields.io/gratipay/faleij.svg
[gratipay-url]: https://gratipay.com/faleij/

# mongoose toObject project

[![NPM version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Dependency Status][dependency-image]][dependency-url]
[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![Gratipay][gratipay-image]][gratipay-url]

An ``toObject`` projection plugin for mongoose.

Adds advanced projection capabilities to ``toObject`` with optional predefined levels and level selector capabilities.

## Installation

``` bash
$ npm install mongoose-to-object-project
```

## Usage

Register this plugin last as it will bootstrap any previous transform function option.

``` javascript
schema.plugin(require('mongoose-to-object-project'), {
  // your predefined levels:
  levels: {
    // public level
    public: 'some.deep.field.to.include -some.deep.field.to.exclude',
    // private level
    private: '-password',
    // system level
    system: ''
  },
  // (optional) default level as a String
  level: 'public',
  //  or a synchronous level selector function (preferred method)
  // (all transform options are passed on to level selector functions)
  level: (doc, ret, options) => doc._id.equals(options.user._id) ? 'private' : 'public'
});
```

## Plugin Options

``levels: Object { levelName: String }`` - Predefined levels to use with a level selector. String for each level is a Mongoose style dot-notation, space delimited projection. Both inclusions and exclusions are possible but inclusions takes precedence thus excluding all other fields.

``level: String`` - Basic static level selector.

``level: Function(doc, ret, options)`` - Synchronous function that must return level name to use as a string. **Preferred level selector method!**
* ``doc`` - Mongoose Document
* ``ret`` - Document as plain Object
* ``options`` - Transform options (Same as ``obj`` - if specified)

# Model Schema Extensions

## _static_ toObjectOptionsExtend(``obj``)
This method extends ``obj`` with the default schema toObject options (Adds defaults to prototype chain).  
In mongoose the options passed to ``toObject`` do not inherit the defaults, this method solves this.

Example:

``` javascript
let options = Model.toObjectOptionsExtend({
    user: req.user,
    projection: '-some.field.to.exclude some.field.to.include'
});
let plainObject = document.toObject(options);
```

## _method_ toObject(``obj``)
Added options:  
``obj.projection: String`` - Mongoose style dot-notation, space delimited projection argument. Both inclusions and exclusions are possible but inclusions takes precedence thus excluding all other fields.

``obj.level: String`` - Set level to use. (!)

``obj.level: Function(doc, ret, options)`` - Synchronous function that must return level name to use as a string. (!)
* ``doc`` - Mongoose Document
* ``ret`` - Document as plain Object
* ``options`` - Transform options (Same as ``obj`` - if specified)

(!) **CAUTION**  
level option is passed to the toObject method call of populated subdocuments and may not be compatible. Use with caution and if possible, avoid level option completely and depend on schema defaults instead. Function is the preferred level selector method in plugin options.

# Compatibility
Only intended for Mongoose v4 with NodeJS later than v4. Tested with Mongoose 4.2.8.

# QA
Q. What about toJSON?  
A.Use option ``json: true`` with toObject, same result.

# License
[LGPL-3](LICENSE)

Copyright (c) 2015 Faleij <faleij@gmail.com>
