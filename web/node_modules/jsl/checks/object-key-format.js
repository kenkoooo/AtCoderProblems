module.exports = object_key_fmt

object_key_fmt.selector = 'object > *'

function object_key_fmt(node, subsource, alert) {
  var sub = subsource(node)
    , src

  if(node.kind !== 'init') {
    return
  }

  src = sub(node.key.range[1], node.value.range[0])

  if(src !== ': ') {
    alert(
        node
      , 'expected ": ", got %r'
      , src
    )
  }
}
