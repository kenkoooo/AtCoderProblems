module.exports = make_tabs

function make_tabs(depth) {
  var arr = []

  while(arr.length < depth) {
    arr.push('  ')
  }

  return arr.join('')
}
