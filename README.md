# mongoose toObject project
[![NPM version][npm-image]][npm-url] [![NPM Downloads][downloads-image]][downloads-url] [![Dependency Status][dependency-image]][dependency-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url] [![License][license-image]](LICENSE) [![Gratipay][gratipay-image]][gratipay-url]

`toObject` projection plugin for mongoose.

Adds advanced field selection capabilities to `toObject` with optional predefined levels and level selector capabilities.

## Installation

```bash
$ npm install mongoose-to-object-project
```

## Basic Usage
Register this plugin last as it will bootstrap any previous transform function option.

```javascript
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
  //  or a synchronous level selector function (preferred method).
  // All transform options are passed on to level selector functions,
  // e.g. we can get the user that requested the transform from `options.user`
  // if user is passed into `toObject` options, like `toObject({ user: req.user })`.
  level: (doc, ret, options) => doc._id.equals(options.user._id) ? 'private' : 'public'
});
```

### Schema Tree Level Definitions
It is possible to define level inclusions and exclusions in the schema declaration.<br>**Mixing inclusions and exclusions are prohibited and throws an error.**<br>**Inclusion levels must be predefined in plugin level options.**

```javascript
const schema = new Schema({
    myInvisibleField: {
      type: String,
      level: '-public -private' // visible on levels other than 'public' and 'private'
    },
    myInternalField: {
      type: String,
      level: 'internal' // only visible on 'internal' level, 'internal' must be predefined.
    }
});

schema.plugin(require('mongoose-to-object-project'), {
  levels: {
      'internal': '' // predefintion
  }
});
```

## Plugin Options

```javascript
schema.plugin(require('mongoose-to-object-project'), options);
```

### `levels: Object`
Predefined levels to use with a level selector. Key is level name. Value is a Mongoose style dot-notation, space delimited projection. Both inclusions and exclusions are possible but inclusions takes precedence thus excluding all other fields.

```javascript
levels: {
    public: 'username rank status',
    private: '-password -secretField -secret.deep.field'
}
```

### `level: String`
Basic static level selector.

```javascript
level: 'public'
```

### `level: Function(doc, ret, options)`
Synchronous function that must return level name to use as a string. **Preferred level selector method!**
- `doc` - Mongoose Document
- `ret` - Document as plain Object
- `options` - Transform options (Same as `obj` - if specified)

```javascript
level: (doc, ret, options) => doc._id.equals(options.user._id) ? 'private' : 'public'
```

# Model Schema Extensions
## [_method_] getLevelSchemaTree(`levelName`)
Returns a clone of the schema tree (plain object) with level projection applied.

## [_method_] toObject(`obj`)<a name="toObject"></a>
Added options:

`obj.projection: String` - Mongoose style dot-notation, space delimited projection argument. Both inclusions and exclusions are possible but inclusions takes precedence thus excluding all other fields.

`obj.level: String` - Set level to use. (!)

`obj.level: Function(doc, ret, options)` - Synchronous function that must return level name to use as a string. (!)
- `doc` - Mongoose Document
- `ret` - Document as plain Object
- `options` - Transform options (Same as `obj` - if specified)

(!) **CAUTION**<br>level option is passed to the toObject method call of populated subdocuments and may not be compatible. Use with caution and if possible, avoid level option completely and depend on schema defaults instead. Function is the preferred level selector method in plugin options.

## [_static_] toObjectOptionsExtend(`obj`)
This method extends `obj` with the default schema toObject options (Adds defaults to prototype chain).<br>In mongoose the options passed to `toObject` do not inherit the defaults, this method solves this.

Example:

```javascript
let options = Model.toObjectOptionsExtend({
    user: req.user,
    projection: '-some.field.to.exclude some.field.to.include'
});
let plainObject = document.toObject(options);
```

## [_method_] set(`path`, `val`, `[type]`, `[options]`)
Added options:  same as [`toObject`](#toObject)  
See: [mongoose docs Document#set](http://mongoosejs.com/docs/api.html#document_Document-set)

# Compatibility
Only intended for Mongoose v4 with NodeJS later than v4. Tested with Mongoose 4.2.8.

# Q&A
Q. What about toJSON?<br>A.Use option `json: true` with toObject, same result.

# License
[LGPL-3](LICENSE)

Copyright (c) 2015 Faleij [faleij@gmail.com](mailto:faleij@gmail.com)

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
[license-image]: https://img.shields.io/badge/license-LGPL3.0-blue.svg
[gratipay-image]: https://img.shields.io/gratipay/faleij.svg
[gratipay-url]: https://gratipay.com/faleij/
