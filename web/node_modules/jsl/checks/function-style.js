module.exports = function_style

function_style.selector = 'function'

function function_style(node, subsource, alert) {
  var slice = subsource(node)
    , string = 'function'
    , ident = node.id
    , varnames = {}
    , result
    , valid

  if(ident) {
    string += ' ' + node.id.name
  }

  string += '(' + node.params.map(function(child) {
    if(child.type === 'Identifier') {
      if(varnames[child.name]) {
        alert(
            child
          , 'saw %r multiple times!'
          , child.name
        )
      }

      varnames[child.name] = true
    }

    return child.src
  }).join(', ') + ')'

  result = slice(node.range[0], node.range[0] + string.length)
  valid = result === string

  if(!valid) {
    alert(
        node
      , 'expected %r, got %r`'
      , string
      , result
    )
  }

  result = slice(node.range[0] + string.length - 1, node.body.range[0] + 1)

  if(result !== ') {') {
    alert(
        node
      , 'expected %r, got %r`'
      , string
      , result
    )
  }
}
