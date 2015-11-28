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
  //  or a synchronous level selector function (all transform options are passed on to level selector functions)
  level: (doc, ret, options) => doc._id.equals(options.user._id) ? 'private' : 'public'
});
```
## toObjectExtend(options)
This method extends your custom options with the default toObject options and is the preferred way to call toObject.

``` javascript
let object = document.toObjectExtend({
    user: req.user
});
```

# License

[LGPL-3](LICENSE)

Copyright (c) 2015 Faleij <faleij@gmail.com>
