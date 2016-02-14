var trailing_newline = require('./trailing-newline')

module.exports = check_maybe_newline

check_maybe_newline.selector = 'expr + *'

function check_maybe_newline(node, subsource, alert) {
  if(node.type === 'ExpressionStatement') {
    return
  }

  return trailing_newline(node, subsource, alert)
}

