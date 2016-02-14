module.exports = if_return_early

if_return_early.selector = '' + [
    'if[alternate] > *:first-child + block > :any(continue, break, return)'
  , 'if[alternate]:first-child:last-child:not(.alternate)'
]

function if_return_early(node, subsource, alert) {
  var current = node

  while(current && current.type !== 'IfStatement') {
    current = current.parent
  }

  alert(
      current.test
    , 'unnecessary `else` case.'
  )
}
