# mongoose toObject project
Adds advanced projection capabilities to ``toObject`` with optional predefined levels and level selector capabilities.

## Installation

``` bash
$ npm install mongoose-to-object-project
```

## Usage
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
  //  or a synchronous level selector function
  // (all transform options are passed on to level selector functions)
  level: (doc, ret, options) => doc._id.equals(options.user._id) ? 'private' : 'public'
});
```

# Model Schema Extensions

## _static_ toObjectOptionsExtend(``obj``)
This method extends ``obj`` with the default schema toObject options (Adds defaults to prototype chain).  
In mongoose the options passed to ``toObject`` do not inherit the defaults, this method solves this.

Example:

``` javascript
let options = Model.toObjectOptionsExtend({ user: req.user });
let plainObject = document.toObject(options);
```

# Compatibility

Only intended for Mongoose v4 with NodeJS later than v4. Tested with Mongoose 4.2.8.

# QA

Q. What about toJSON?  
A.Use option ``json: true`` with toObject, same results.

# License

[LGPL-3](LICENSE)

Copyright (c) 2015 Faleij <faleij@gmail.com>
