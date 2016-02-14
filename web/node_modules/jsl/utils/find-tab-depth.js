module.exports = find_tab_depth

var language = require('cssauron-falafel')
  , subsource = require('./source')

function find_tab_depth(node) {
  var any = language('ternary, switch, object, block, array, case')
    , isspecial = language('object, array')
    , isvar = language('variable')
    , iscall = language('call')
    , wascall = iscall(node)
    , object_count = 0
    , current = node
    , depth = 0 
    , last
    , sub

  while(current) {
    if(any(current)) {
      ++depth
    }

    // special case all the things!
    if(isspecial(current)) {
      ++object_count
      if(object_count > 1 || wascall) {
        ++depth
      }
    }

    if(iscall(current) && current !== node) {
      sub = subsource(current)
      last = current.callee

      for(var i = 0, len = current.arguments.length; i < len; ++i) {
        if(sub(last.range[1], current.arguments[i].range[0]).indexOf('\n') > -1) {
          depth += 2
          break
        }
        last = current.arguments[i]
      } 
    }

    if(isvar(current) && current.parent.declarations.length > 1) {
      ++depth
      ++depth
    }
    current = current.parent
  }

  return depth
}

