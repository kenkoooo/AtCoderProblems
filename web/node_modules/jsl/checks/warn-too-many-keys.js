module.exports = {flag: flag, check: check}

flag.selector = 'variable > object > * > * > *'
check.selector = '[type=VariableDeclaration]'

function flag(node) {
  var cur = node

  while(cur && cur.type !== 'VariableDeclaration') {
    cur = cur.parent
  }

  if(!cur) {
    return
  }

  cur.__obj_count__ = (cur.__obj_count__ || 0)
  ++cur.__obj_count__
}

function check(node, subsource, alert) {
  if(node.declarations.length > 1 && node.__obj_count__ >= 1) {
    alert(
        node
      , 'do not nest complex (>3 keys) objects in var declarations.'
    )
  }
}
