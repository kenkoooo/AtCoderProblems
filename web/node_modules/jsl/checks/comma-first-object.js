module.exports = comma_first_object

var find_tab_depth = require('../utils/find-tab-depth')
  , make_tabs = require('../utils/make-tabs')

comma_first_object.selector = 'object'

function comma_first_object(node, subsource, alert) {
  var nodes = node.properties.slice()
    , sub = subsource(node)
    , last_node
    , cur_node
    , str

  if(nodes.length === 0) {
    if(node.src !== '{}') {
      alert(
          node
        , 'empty objects should be written `{}`'
      )
    }

    return
  }

  if(nodes[nodes.length - 1].start.line === node.start.line) {
    return
  }

  var depth = find_tab_depth(node)
    , tabs = make_tabs(depth)
    , is_first = true
    , adjust = 0
    , rex
    , idx

  last_node = node

  while(cur_node = nodes.shift()) {
    str = sub(
        is_first ? last_node.range[0] : last_node.range[1]
      , cur_node.range[0]
    )

    if(is_first) {
      rex = new RegExp('^\\{\\s*\n\\s{' + (2 * depth + 2) + '}$')

      if(!rex.test(str)) {
        alert(
            cur_node
          , 'expected %r, got %r'
          , '{\n' + make_tabs(depth + 1)
          , str
        )
      }

      rex = new RegExp('^\\s*\\n\\s{' + (2 * depth) + '}, $')
    } else if(!rex.test(str)) {
      alert(
          cur_node
        , 'expected %r, got %r'
        , '\n' + tabs
        , str
      )
    }

    last_node = cur_node
    is_first = false
  }
}
