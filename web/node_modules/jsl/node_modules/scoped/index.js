var lang = require('cssauron-falafel')

var is_scope_creation = lang('function, catch, [has_let_statements], :root')
  , is_let_scope = lang(
      'function, block, for, for-in, [type=ForOfStatement], :root'
    )
  , is_neutral_id = lang(
      'object > * > id:first-child, ' +
      'lookup > * + id, function > id, catch > id'
    )
  , is_declaration = lang('variable > id:first-child')
  , is_assign = lang('assign > id:first-child')
  , is_function = lang('function, :root')
  , is_root = lang(':root')
  , is_ident = lang('id')

module.exports = function(ignore, attach_scope, ready) {
  var scopes = []

  if(arguments.length < 3) {
    ready = attach_scope
    attach_scope = false
  }

  if(arguments.length === 1) {
    ready = ignore
    ignore = []
  }

  return write_node

  function write_node(node) {
    switch(true) {
      case !!is_root(node): finish(node); break
      case !!is_declaration(node): decl(node); break
      case !!is_scope_creation(node): exit(node); break
      case !!is_ident(node) && !is_neutral_id(node): use(node); break
    }
  }

  function decl(node) {
    var is_let = node.parent.type === 'VariableDeclarator'
      , parent
      
    is_let = node.parent.parent.kind === 'let'

    parent = get_parent(node, is_let ? is_let_scope : is_function)
  
    if(is_let) {
      parent.has_let_statements = true
    }

    get_scope(parent).declare(node)
  }

  function exit(node) {
    var parent = get_parent(node.parent, is_scope_creation)
      , this_scope
      , scope

    this_scope = get_scope(node)

    if(!parent) {
      return finish(node)
    }

    scope = get_scope(parent)

    // pull function name out into containing
    // scope iff this node is a declaration to
    // handle named function statement hoisting

    if(node.id && node.type === 'FunctionDeclaration') {
      scope.declare(node.id)
    }

    scope.consume(this_scope)
  }

  function use(node) {
    if(ignore.indexOf(node.name) !== -1) {
      return
    }

    var parent = get_parent(node.parent, is_scope_creation)
      , scope

    if(!parent) {
      return finish(node)
    }

    scope = get_scope(parent)
    scope.use(node)
  }

  function get_scope(node) {
    for(var i = 0, len = scopes.length; i < len; ++i) {
      if(scopes[i].defined_by === node) {
        return scopes[i]
      }
    }

    return scopes.unshift(make_scope(node)), scopes[0]
  }

  function make_scope(node) {
    var scope = {
        consume: scope_consume
      , defined_by: node
      , use: scope_use
      , declared: scope_make_decl(node)
      , declare: scope_declare
      , unresolved: []
      , children: []
    }

    if(attach_scope) {
      node.scope = scope
    }

    return scope
  }

  function scope_declare(node) {
    var scope = this
      , promoted

    if(scope.declared.some(matches(node))) {
      return
    }

    scope.unresolved = scope.unresolved.filter(function(item) {
      if(item.name === node.name) {
        promoted = item
      }

      return item.name !== node.name
    })

    if(promoted) {
      promoted.nodes.push({
          node: node
        , kind: 'declare'
      })
    }

    scope.declared.push(
        promoted || {name: node.name, nodes: [{node: node, kind: 'declare'}]}
    )

    function not_match(item) {
      return item.name !== node.name
    }
  }

  function scope_make_decl(node) {
    var out = node.params ? node.params :
              node.param ? [node.param] :
              []
  
    out = out.slice()

    if(node.id && node.type === 'FunctionExpression') {
      out.push(node.id)
    }

    out = out.map(function(node) {
      return {name: node.name, nodes: [{node: node, kind: 'declare'}]}
    })

    return out
  }

  function scope_use(node) {
    var scope = this
      , kind

    kind = is_assign(node) ? 'explicit' : 'implicit'
   
    for(var i = 0, len = scope.declared.length; i < len; ++i) {
      if(node.name !== scope.declared[i].name) {
        continue
      }

      scope.declared[i].nodes.push({node: node, kind: kind})

      return
    }

    for(var i = 0, len = scope.unresolved.length; i < len; ++i) {
      if(node.name !== scope.unresolved[i].name) {
        continue
      }

      scope.unresolved[i].nodes.push({node: node, kind: kind})

      return
    }

    scope.unresolved.push({name: node.name, nodes: [{node: node, kind: kind}]})
  }

  function scope_consume(other_scope) {
    var scope = this
      , nodes

    scopes.splice(scopes.indexOf(other_scope), 1)
    scope.children.push({
        scope: other_scope.defined_by
      , vars: other_scope.declared
      , uses: other_scope.unresolved
      , children: other_scope.children  
    })

    other_scope.parent = scope

    for(var i = 0, len = other_scope.unresolved.length; i < len; ++i) {
      nodes = other_scope.unresolved[i].nodes

      for(var j = 0, jlen = nodes.length; j < jlen; ++j) {
        scope.use(nodes[j].node)
      }
    } 
  }

  function finish(node) {
    if(!scopes.length) {
      scopes.push({
          defined_by: node
        , declared: []
        , unresolved: []
        , children: []
      })
    }

    ready({
        scope: scopes[0].defined_by
      , vars: scopes[0].declared
      , uses: scopes[0].unresolved
      , children: scopes[0].children  
    })
  }

  function matches(node) {
    return function(inner) {
      return inner.name === node.name
    }
  }
}

function get_parent(node, sel) {
  while(node && !sel(node)) {
    node = node.parent
  } 

  return node
}
