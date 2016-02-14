var deps = require('module-deps')
  , through = require('through')

module.exports = function(linter) {
  return function(entry_points) {
    var cwd = process.cwd()

    if(typeof entry_points === 'string') {
      entry_points = [entry_points]
    }

    return function(assert, ready) {
      deps(entry_points, {filter: only_relative})
        .pipe(through(items))
        .pipe(through(null, done))

      function items(dep) {
        var self = this

        linter()
          .on('data', ondata)
          .on('end', function() {
            assert.ok(true, dep.id.replace(cwd, '.') + ' passes lint')
            self.queue('')
          })
          .end(dep.source)

        function ondata(msg) {
          if(msg.type !== 'error') {
            return
          }

          assert.fail(
              dep.id.replace(cwd, '.') + 
              ':' + msg.line + ':' + msg.col +
              ', ' + msg.message
          )
        }
      }

      function done() {
        if(ready === undefined && assert.end) {
          assert.end()
        }
      }
    }
  }
}

function only_relative(id) {
  return id[0] === '.'
}
