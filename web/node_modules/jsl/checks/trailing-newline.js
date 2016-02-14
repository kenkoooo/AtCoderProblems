module.exports = check_trailing_newline

var subsource = require('../utils/source')

var nl_types = [
    'variable-decl'
  , 'if'
  , 'for'
  , 'for-in'
  , 'try'
  , 'while'
  , 'do-while'
  , '[type=FunctionDeclaration]'
]

check_trailing_newline.selector = ':any(' + nl_types + ') + *'

function check_trailing_newline(node, subsource, alert) {
  var parent_src
    , prev
    , body
    , idx

  body = !Array.isArray(node.parent.body) ?
    (node.parent.body || {}).body :
    node.parent.body

  if(!body) {
    return
  }

  idx = body.indexOf(node)

  if(idx < 0) {
    return
  }

  idx -= 1
  prev = body[idx]
  parent_src = subsource(node.parent)(prev.range[0], node.range[0])

  var idx = parent_src.length - 1
    , left = 2

  while(idx > -1 && /[\n\s]/.test(parent_src[idx])) {
    if(parent_src[idx] === '\n') {
      --left
    }

    --idx
  }

  if(left === 0) {
    return
  }

  alert(
      node
    , 'expected a single blank newline to precede'
  )
}

