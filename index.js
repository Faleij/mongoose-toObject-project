'use strict';

const mpath = require('mpath');
const utils = module.parent.require('mongoose/lib/utils');

function minimize(obj) {
  var k = Object.keys(obj),
    i = k.length,
    h, v;

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
  let out = str.split(' ').reduce((projection, path) => {
    if (path[0] === '-') {
      projection.exclude.push(path.substr(1));
    } else if (path.length) {
      projection.include.push(path);
    }
    return projection;
  }, {
    include: [],
    exclude: []
  });

  // Filter child paths
  Object.keys(out).forEach(key => {
    let fields = out[key].sort();
    out[key] = fields.filter(v => !fields.some(field => v !== field && v.indexOf(field) === 0));
  });

  return out;
}

/*
 * Mongoose ToObject level projection plugin
 */
module.exports = exports = (schema, pluginOptions) => {
  schema.static('toObjectOptionsExtend', options => Object.setPrototypeOf(options, schema.options.toObject));

  if (!pluginOptions.levels) {
    pluginOptions.levels = {};
  }

  let predefinedLevels = Object.keys(pluginOptions.levels);

  // Compile levels to arrays
  predefinedLevels.forEach(key => pluginOptions.levels[key] = compileProjectionStringToArray(pluginOptions.levels[key]));

  // Support schemaType level option
  schema.eachPath((pathName, schemaType) => {
    if (schemaType.options.level) {
      var levels = compileProjectionStringToArray(schemaType.options.level);

      if (levels.include.length > 0 && levels.exclude.length > 0) {
        throw new Error(`"${pathName}" contains inclusions and exclusions, only one type can be used`);
      }

      levels.include.forEach(level => {
        if (!pluginOptions.levels.hasOwnProperty(level)) {
          throw new Error(`"${pathName}" contains undefined level "${level}". Level inclusions must be predefined in plugin options.`);
        }

        predefinedLevels.filter(v => v !== level).forEach(excludeLevel => {
          pluginOptions.levels[excludeLevel].exclude.push(pathName);
        });
      });

      levels.exclude.forEach((level) => {
        if (pluginOptions.levels.hasOwnProperty(level)) {
          pluginOptions.levels[level].exclude.push(pathName);
        } else {
          pluginOptions.levels[level] = {
            include: [],
            exclude: [pathName]
          };
        }
      });
    }
  });

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

    if (!level) {
      throw new Error('unable to determine level');
    }

    // merge user and preset levels projection
    projection.include = projection.include.concat(level.include);
    projection.exclude = projection.exclude.concat(level.exclude);

    // inclusion
    if (projection.include.length) {
      out = projection.include.reduce((p, path) => mpath.set(path, mpath.get(path, ret), p) || p, {});
    }

    // exclusion
    if (projection.exclude.length) {
      projection.exclude.forEach((path) => mpath.set(path, undefined, out));
    }

    return options.minimize ? minimize(out) : out;
  }

  // Set schema toObject options
  schema.options.toObject = schema.options.toObject || {};

  var preTransform = schema.options.toObject.transform;

  schema.options.toObject.transform = preTransform ? (doc, ret, options) => transform(doc, preTransform(doc, ret, options) || ret, options) : transform;
  schema.options.toObject.level = pluginOptions.level; // set default level

  /*
   * Returns simple schema object
   */
  schema.static('getLevelSchemaTree', level => transform(undefined, utils.clone(schema.tree), {
    minimize: true,
    level: level
  }));
};
