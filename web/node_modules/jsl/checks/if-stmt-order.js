module.exports = if_stmt_order

var language = require('cssauron-falafel')

if_stmt_order.selector = 'if[alternate] > * + block + block > *:last-child'

function if_stmt_order(node, subsource, alert) {
  var chk = language(':any(continue, break, return)')
    , con = node.parent.parent.consequent
    , alt = node.parent.parent.alternate
    , test = node.parent.parent.test

  alt.src = alt.src || alt.source()

  if(alt.src.split('\n').length > con.src.split('\n').length) {
    if(chk(node)) {
      return alert(
          test
        , 'decrease nesting by reversing this `if` statement and ' +
          'returning early from the consequent.'
      )
    }

    alert(
        test
      , 'prefer having the larger of the two cases to be the ' +
        'consequent of the if statement.'
    )
  }
}
