module.exports = whitespace

whitespace.selector = 'unary > *'

function whitespace(node, subsource, alert) {
  var sub = subsource(node.parent)
    , op = node.parent.operator
    , src

  if(op === 'typeof' || op === 'void' || op === 'delete') {
    op += ' '
  }

  src = sub(node.parent.range[0], node.range[0])

  while(src.charAt(src.length - 1) === '(') {
    src = src.slice(0, -1)
  }

  while(src.charAt(0) === ')') {
    src = src.slice(1)
  }

  if(src === ' ' + node.parent.operator + ' ') {
    return
  }

  if(src === op) {
    return
  }

  alert(
      node
    , 'expected %r, got %r'
    , op
    , src
  )
}
