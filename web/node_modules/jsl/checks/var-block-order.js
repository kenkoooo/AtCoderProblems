module.exports = var_block_order

var_block_order.selector = '[type=VariableDeclaration]'

function var_block_order(node, subsource, alert) {
  var decl = node.declarations
    , allow_transition = true
    , length = Infinity
    , line_len
    , assign

  assign = decl[0] && !!decl[0].init

  if(!assign) {
    allow_transition = false
  }

  if(node.parent.type === 'ForStatement') {
    return
  }

  for(var i = 0, len = decl.length; i < len; ++i) {
    // skip this check for `self`/`proto` decls.
    if(decl[i].id.name === 'proto' || decl[i].id.name === 'self') {
      continue
    }

    if(!decl[i].init && assign) {
      assign = false
      length = Infinity
    } else if(decl[i].init && !assign) {
      alert(
          decl[i]
        , 'should not transition from no-assign to assign in var block'
      )
    }

    line_len = Math.max.apply(null, decl[i].src.split('\n').map(function(x) {
      return x.length
    }))

    if(line_len > length) {
      alert(
          decl[i]
        , 'variable declarations should be ' +
          'in order of assign, no assign; ' +
          'then line length'
      )
    }

    length = line_len
  }
}

