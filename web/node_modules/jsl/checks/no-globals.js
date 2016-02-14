module.exports = no_explicit_globals

var scoped = require('scoped')

var globals = require('scoped/globals')
  , instance = scoped(globals, ready)
  , last_alert

no_explicit_globals.selector = '*'

function no_explicit_globals(node, subsource, alert) {
  last_alert = alert
  instance(node)
}

function ready(scope) {
  var node
    , use

  for(var i = 0, len = scope.uses.length; i < len; ++i) {
    use = scope.uses[i]

    for(var j = 0, jlen = use.nodes.length; j < jlen; ++j) {
      node = use.nodes[j]


      if(node.kind !== 'explicit') {
        continue
      }

      last_alert(
          node.node
        , 'explicit global %r'
        , use.name
      )
    }
  }
}
