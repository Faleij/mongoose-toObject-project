'use strict';

const mpath = require('mpath');
const utils = module.parent.require('mongoose/lib/utils');

function minimize(obj) {
  var k = Object.keys(obj),
    i = k.length, h, v;

  while (i--) {
    v = obj[k[i]];
    if (undefined === (utils.isObject(v) ? minimize(v) : v)) {
      delete obj[k[i]];
    } else {
      h = true;
    }
  }

  return h ? obj : undefined;
}

function compileProjectionStringToArray(str) {
  return typeof str === 'string' ? str.split(' ').reduce((projection, path) => {
    if (path[0] === '-') {
      projection.exclude.push(path.substr(1));
    } else if (path.length) {
      projection.include.push(path);
    }
    return projection;
  }, {
    include: [],
    exclude: []
  }) : str;
}

/*
 * Mongoose ToObject level projection plugin
 */
module.exports = exports = (schema, pluginOptions) => {
  schema.method('toObjectExtend', function(options) {
    return this.toObject(Object.setPrototypeOf(options, schema.options.toObject));
  });

  // Compile levels to arrays
  Object.keys(pluginOptions.levels).forEach(key => pluginOptions.levels[key] = compileProjectionStringToArray(pluginOptions.levels[key]));

  function transform(doc, ret, options) {
    var out = ret;
    var level = options.level || pluginOptions.level;
    var projection = compileProjectionStringToArray(options.projection || '');

    if (level instanceof Function) {
      level = level(doc, ret, options);
    }

    if (typeof level === 'string') {
      level = pluginOptions.levels[level];
    }

    if (level) {
      // merge user and preset levels projection
      projection.include = projection.include.concat(level.include);
      projection.exclude = projection.exclude.concat(level.exclude);
    }

    // inclusion
    if (projection.include.length) {
      out = projection.include.reduce((p, path) => mpath.set(path, mpath.get(path, ret), p) || p, {});
    }

    // exclusion
    if (projection.exclude.length) {
      projection.exclude.forEach((path) => mpath.set(path, undefined, out));
    }

    return schema.options.minimize ? minimize(out) : out;
  }

  // Set schema toObject options
  schema.options.toObject = schema.options.toObject || {};

  var preTransform = schema.options.toObject.transform;

  schema.options.toObject.transform = preTransform ? (doc, ret, options) => transform(doc, preTransform(doc, ret, options) || ret, options) : transform;
  schema.options.toObject.level = pluginOptions.level; // set default level

  /*
   * Returns simple schema object
   */
  schema.static('getLevelSchema', level => transform(undefined, utils.clone(schema.tree), {
      minimize: false,
      level: level
    }));
};
