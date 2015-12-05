'use strict';

const expect = require('expect.js');
const mongoose = require('mongoose');

/*
TODO:
Test child path filtering.
Test all errors
Test no minimization
Test no preset option
*/

const schema = mongoose.Schema({
  username: String,
  name: String,
  password: String,
  email: String,
  deep: {
    _id: false,
    a: String,
    b: String,
    c: [{
      _id: false,
      a: String,
      b: String
    }]
  },
  notes: {
    title: String,
    content: String
  },
  friend: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  systemField: {
    type: String,
    level: '-public -private -newLevel' // visible on levels other than 'public' and 'private'
  },
  groups: {
    type: String,
    level: 'internal' // only visible on 'internal' level
  }
});

let otherActive = true;
schema.set('toObject', {
  transform: (doc, ret) => {
    if (otherActive)
      ret.otherTransform = true;
  }
});

let options = {
  levels: {
    public: 'username -password -_id -deep otherTransform -friend',
    private: '-password -_id',
    system: '',
    internal: ''
  },
  // optional default level as string or a synchronous level selector function returning level name as a string (recommended), function is passed all transform arguments
  level: 'public'
};

schema.plugin(require('.'), options);

const Model = mongoose.model('User', schema);

describe('ToObject Project Single Level', function () {

  let friend = new Model({
    username: 'Doe',
    name: 'John Doe',
    password: '654321',
    email: 'doe@email.com'
  });

  let user = new Model({
    username: 'John',
    name: 'John Jhonsson',
    password: '123456',
    email: 'private@email.com',
    friend: friend,
    systemField: 'sys',
    groups: 'admin user',
    notes: {
      title: undefined
    },
    data: []
  });

  it('should respect existing toObject transform', () => {
    let data = user.toObject();
    otherActive = false;
    expect(data.otherTransform).to.be.ok();
  });

  it('level selector function should select level', function () {
    let data = user.toObject({
      user: user,
      // Set and override level selector.
      // A simple level selector based on user _id equality.
      // Overrides all (sub)schema defined level functions or defaults - generally not a good idea but should work anyhow
      level: (doc, ret, options) => doc._id.equals(options.user._id) ? 'private' : 'public'
    });
    expect(data).to.eql({
      username: 'John',
      name: 'John Jhonsson',
      email: 'private@email.com',
      friend: {
        username: 'Doe'
      },
      deep: {
        c: []
      }
    });
  });

  it('should be public by default', function () {
    let data = user.toObject();
    expect(data).to.eql({
      username: 'John'
    });
  });

  it('should not minimize', function () {
    let data = user.toObject({ minimize: false, level: 'internal' });
    expect(data).to.have.key('notes');
  });

  it('should minimize', function () {
    let data = user.toObject({ minimize: true, level: 'internal' });
    expect(data).to.not.have.key('notes');
  });

  it('should be private', function () {
    let data = user.toObject({
      level: 'private',
      minimize: true
    });
    expect(data).to.eql({
      username: 'John',
      name: 'John Jhonsson',
      email: 'private@email.com',
      friend: {
        username: 'Doe',
        name: 'John Doe',
        email: 'doe@email.com',
        deep: {
          c: []
        }
      },
      deep: {
        c: []
      }
    });
  });

  it('should be system', function () {
    let data = user.toObject({
      level: 'system',
      minimize: true
    });
    expect(data).to.eql({
      _id: user._id,
      username: 'John',
      name: 'John Jhonsson',
      password: '123456',
      email: 'private@email.com',
      friend: {
        _id: user.friend._id,
        username: 'Doe',
        name: 'John Doe',
        password: '654321',
        email: 'doe@email.com',
        deep: {
          c: []
        }
      },
      deep: {
        c: []
      },
      systemField: 'sys'
    });
  });

  it('should be be modified private', function () {
    let data = user.toObject({
      level: 'private',
      projection: '-username -friend -deep',
      minimize: true
    });
    expect(data).to.eql({
      name: 'John Jhonsson',
      email: 'private@email.com'
    });
  });

  it('public should not include password even if asked to', function () {
    let data = user.toObject({
      level: 'public',
      projection: 'password',
      minimize: true
    });
    expect(data).to.eql({
      username: 'John'
    });
  });

  it('no level should equal public', function () {
    let data = user.toObject({
    minimize: true});
    expect(data).to.eql({
      username: 'John'
    });
  });

  it('only username should exist', function () {
    let data = user.toObject({
      projection: 'username'
    });
    expect(data).to.eql({
      username: 'John'
    });
  });

  it('systemField should not exist', function () {
    let data = user.toObject();
    expect(data).to.not.have.key('systemField');
  });

  it('systemField should exist', function () {
    let data = user.toObject({
      level: 'system',
      minimize: true
    });
    expect(data).to.have.key('systemField');
  });

  it('groups should not exist', function () {
    let data = user.toObject();
    expect(data).to.not.have.key('groups');
  });

  it('groups should exist', function () {
    let data = user.toObject({
      level: 'internal',
      minimize: true
    });
    expect(data).to.have.key('groups');
  });

  describe('toObjectOptionsExtend', function () {
    let data = Model.toObjectOptionsExtend({
      name: 'Doe'
    });

    it('name should equal to Doe', function () {
      expect(data.name).to.eql('Doe');
    });

    it('level should equal public', function () {
      expect(data.level).to.eql('public');
    });
  });
});

describe('ToObject Project MultiLevel', function () {
  let user = new Model({
    username: 'John',
    name: 'John Jhonsson',
    password: '123456',
    email: 'private@email.com',
    deep: {
      a: 'a var',
      b: 'b var',
      c: [{
        a: 'c.a var 0',
        b: 'c.b var 0'
      }, {
        a: 'c.a var 1',
        b: 'c.b var 1'
      }]
    }
  });

  it('should be public by default', function () {
    let data = user.toObject();
    expect(data).to.eql({
      username: 'John'
    });
  });

  it('should be private', function () {
    let data = user.toObject({
      level: 'private',
      minimize: true
    });
    expect(data).to.eql({
      username: 'John',
      name: 'John Jhonsson',
      email: 'private@email.com',
      deep: {
        a: 'a var',
        b: 'b var',
        c: [{
          a: 'c.a var 0',
          b: 'c.b var 0'
        }, {
          a: 'c.a var 1',
          b: 'c.b var 1'
        }]
      }
    });
  });

  it('deep should not exist', function () {
    let data = user.toObject({
      level: 'private',
      projection: '-deep',
      minimize: true
    });
    expect(data).to.eql({
      username: 'John',
      name: 'John Jhonsson',
      email: 'private@email.com'
    });
  });

  it('deep.c.a should be undefined', function () {
    let data = user.toObject({
      level: 'private',
      projection: '-deep.c.a',
      minimize: true
    });
    expect(data).to.eql({
      username: 'John',
      name: 'John Jhonsson',
      email: 'private@email.com',
      deep: {
        a: 'a var',
        b: 'b var',
        c: [{
          a: undefined,
          b: 'c.b var 0'
        }, {
          a: undefined,
          b: 'c.b var 1'
        }]
      }
    });
  });

  it('should get level schema', function () {
    let schema0 = Model.getLevelSchemaTree('public');
    expect(schema0).to.be.ok();
    expect(schema0).to.eql({
      username: String
    });
  });
});

describe('Errors', function () {

  describe('schema tree level defintion', function () {
    let schema0 = mongoose.Schema({
      field: {
        type: String,
        level: 'public'
      }
    });
    let schema1 = mongoose.Schema({
      field: {
        type: String,
        level: 'public -private'
      }
    });

    let options0 = {};
    let options1 = {
      levels: {
        public: '',
        private: ''
      }
    };
    let error0;
    let error1;

    try {
      schema0.plugin(require('.'), options0);
    } catch (err) {
      error0 = err;
    }

    try {
      schema1.plugin(require('.'), options1);
    } catch (err) {
      error1 = err;
    }

    let pathName = 'field';
    let level = 'public';

    it('no predefined level should trow error', function () {
      expect(error0).to.be.a(Error);
      expect(error0.message).to.be(`"${pathName}" contains undefined level "${level}". Level inclusions must be predefined in plugin options.`);
    });

    it('mixing inclusion and exclusion should trow error', function () {
      expect(error1).to.be.a(Error);
      expect(error1.message).to.be(`"${pathName}" contains inclusions and exclusions, only one type can be used`);
    });
  });

  describe('options', function () {
    let schema0 = mongoose.Schema({
      field: {
        type: String,
      }
    });

    let options0 = {
      levels: {
        public: {}
      }
    };
    let error;
    try {
      schema.plugin(require('.'), options0);
    } catch (err) {
      error = err;
    }

    it('non-string level should throw error', function () {
      expect(error).to.be.a(Error);
    });
  });

  describe('transform', function () {
    let schema0 = mongoose.Schema({
      field: {
        type: String,
      }
    });

    let options0 = {
      levels: {
        public: 'field'
      },
      level: () => {}
    };
    let error;

    schema0.plugin(require('.'), options0);

    let Model0 = mongoose.model(Date.now().toString(), schema0);

    try {
      new Model0({}).toObject();
    } catch (err) {
      error = err;
    }

    it('no level should trow error', function () {
      expect(error).to.be.a(Error);
      expect(error.message).to.be('unable to determine level');
    });
  });
});
