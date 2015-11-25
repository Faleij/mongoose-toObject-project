'use strict';

const expect = require('expect.js');
const mongoose = require('mongoose');

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
  friend: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

var otherActive = true;
schema.set('toObject', {
  transform: (doc, ret) => {
    if (otherActive)
      ret.otherTransform = true;
  }
});

schema.plugin(require('.'), {
  levels: {
    public: 'username -password -_id -deep otherTransform -friend',
    private: '-password -_id',
    system: ''
  },
  // optional default level as string or a synchronous level selector function returning level name as a string (recommended), function is passed all transform arguments
  level: 'public'
});

const Model = mongoose.model('User', schema);

describe('ToObject Project Single Level', function() {

  var friend = new Model({
    username: 'Doe',
    name: 'John Doe',
    password: '654321',
    email: 'doe@email.com'
  });

  var user = new Model({
    username: 'John',
    name: 'John Jhonsson',
    password: '123456',
    email: 'private@email.com',
    friend: friend
  });

  it('should respect existing toObject transform', () => {
    var data = user.toObject();
    otherActive = false;
    expect(data.otherTransform).to.be.ok();
  });

  it('level selector function should select level', function() {
    var data = user.toObject({
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

  it('should be public by default', function() {
    var data = user.toObject();
    expect(data).to.eql({
      username: 'John'
    });
  });

  it('should be private', function() {
    var data = user.toObject({
      level: 'private'
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

  it('should be system', function() {
    var data = user.toObject({
      level: 'system'
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
      }
    });
  });

  it('should be be modified private', function() {
    var data = user.toObject({
      level: 'private',
      projection: '-username -friend -deep'
    });
    expect(data).to.eql({
      name: 'John Jhonsson',
      email: 'private@email.com'
    });
  });

  it('public should not include password even if asked to', function() {
    var data = user.toObject({
      level: 'public',
      projection: 'password'
    });
    expect(data).to.eql({
      username: 'John'
    });
  });

  it('no options should equal public', function() {
    var data = user.toObject({});
    expect(data).to.eql({
      username: 'John'
    });
  });

  it('only username should exist', function() {
    var data = user.toObject({
      projection: 'username'
    });
    expect(data).to.eql({
      username: 'John'
    });
  });
});

describe('ToObject Project MultiLevel', function() {

  var user = new Model({
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

  it('should be public by default', function() {
    var data = user.toObject();
    expect(data).to.eql({
      username: 'John'
    });
  });

  it('should be private', function() {
    var data = user.toObject({
      level: 'private'
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

  it('deep should not exist', function() {
    var data = user.toObject({
      level: 'private',
      projection: '-deep'
    });
    expect(data).to.eql({
      username: 'John',
      name: 'John Jhonsson',
      email: 'private@email.com'
    });
  });

  it('deep.c.a should be undefined', function() {
    var data = user.toObject({
      level: 'private',
      projection: '-deep.c.a'
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

  it('should get level schema', function() {
    var schema = Model.getLevelSchema('public');
    expect(schema).to.be.ok();
    expect(schema).to.eql({
      username: String
    });
  });
});
