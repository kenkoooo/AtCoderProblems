var fs = require('fs')
  , format = require('../utils/format')

module.exports = function(linter) {
  return install

  function install(match) {
    match = match || function(x) {
      return x.indexOf('node_modules') === -1
    }

    var original = require.extensions['.js']

    require.extensions['.js'] = function(module, filename) {
      if(!match(filename)) {
        return original(module, filename)
      }

      var data = fs.readFileSync(filename, 'utf8')
        , lint

      lint = linter()

      lint
        .pipe(format(filename))
        .pipe(process.stderr, {end: false})
   
      lint.end(data)

      return original(module, filename)
    }
  }
}
