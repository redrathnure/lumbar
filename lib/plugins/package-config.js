var fu = require('../fileUtil'),
    handlebars = require('handlebars');

const DEFAULT_CONFIG_TEMPLATE = "{{{name}}} = {{{data}}};\n";
var packageConfigTemplate = handlebars.compile(DEFAULT_CONFIG_TEMPLATE);

function loadPackageConfig(name, configFile, callback) {
  if (!configFile) {
    return callback(new Error('package_config.json specified without file being set'));
  }

  fu.readFile(configFile, function(err, data) {
    if (err) {
      callback(err);
      return;
    }

    callback(
      undefined,
      packageConfigTemplate({
        name: name,
        data: data
      })
    );
  });
};

module.exports = {
  resource: function(context, next) {
    var resource = context.resource,
        config = context.config,
        options = context.options;

    if (resource === 'package_config.json' || resource === 'package-config.json') {
      var packageConfigGen = function(callback) {
        var packageConfig = config.attributes.packageConfig || 'namespace.config';
        loadPackageConfig(packageConfig, options.packageConfigFile, function(err, data) {
          callback(err, data && {data: data, noSeparator: true});
        });
      };
      packageConfigGen.sourceFile = undefined;
      return packageConfigGen;
    }

    return next();
  }
};