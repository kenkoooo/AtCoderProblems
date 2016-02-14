module.exports = use_preincrement

use_preincrement.selector = 'for > * + * + update'

function use_preincrement(node, subsource, alert) {
  if(!node.prefix) {
    alert(
        node
      , 'prefer `++i` style in for loop update statements'
    )
  }
}
