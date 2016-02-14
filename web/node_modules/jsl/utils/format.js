module.exports = format

var through = require('through')

function format(filename) {
  var stream = through(write)

  return stream

  function write(msg) {
    return stream.queue(
        (msg.type === 'error' ? 'E' : 'W') + ' ' + 
        filename.replace(process.cwd(), '.') + 
        ' L' + msg.line + ': ' + msg.message + '\n'
    )
  }
}
