module.exports = parents

var language = require('cssauron-falafel')

function parents(node, sel) {
  sel = language(sel)

  var current = node.parent
    , output = []

  while(current) {
    if(sel(current)) {
      output.push(current)
    }

    current = current.parent
  }

  return output
}
