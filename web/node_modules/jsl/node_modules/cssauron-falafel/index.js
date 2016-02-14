var cssauron = require('cssauron')

module.exports = cssauron({
    tag: function(node) { return map[node.type] }
  , parent: 'parent'
  , children: get_children
  , contents: 'source()'
  , 'class': get_class
  , attr: function(node, attr) { return node[attr] }
})

function get_class(node) {
  if(!node.parent) {
    return null
  }

  for(var key in node.parent) {
    if(node.parent[key] === node) {
      return key
    }

    if(Array.isArray(node.parent[key])) {
      for(var i = 0, len = node.parent[key].length; i < len; ++i) {
        if(node.parent[key][i] === node) {
          return key
        }
      }
    }
  }

  return null
}

var map = {
    'LabeledStatement': 'label'
  , 'BlockStatement': 'block'
  , 'Program': 'root'
  , 'ExpressionStatement': 'expr'
  , 'ConditionalExpression': 'ternary'
  , 'IfStatement': 'if'
  , 'BreakStatement': 'break'
  , 'ContinueStatement': 'continue'
  , 'WithStatement': 'with'
  , 'SwitchStatement': 'switch'
  , 'ReturnStatement': 'return'
  , 'ThrowStatement': 'throw'
  , 'TryStatement': 'try'
  , 'WhileStatement': 'while'
  , 'DoWhileStatement': 'do-while'
  , 'ForStatement': 'for'
  , 'ForInStatement': 'for-in'
  , 'FunctionDeclaration': 'function'
  , 'VariableDeclaration': 'variable-decl'
  , 'VariableDeclarator': 'variable'
  , 'LogicalExpression': 'binary'
  , 'BinaryExpression': 'binary'
  , 'AssignmentExpression': 'assign'
  , 'ArrayExpression': 'array'
  , 'ObjectExpression': 'object'
  , 'ObjectKeyExpression': 'key'
  , 'FunctionExpression': 'function'
  , 'SequenceExpression': 'sequence'
  , 'UpdateExpression': 'update'
  , 'UnaryExpression': 'unary'
  , 'CallExpression': 'call'
  , 'NewExpression': 'new'
  , 'MemberExpression': 'lookup'
  , 'SwitchCase': 'case'
  , 'CatchClause': 'catch'
  , 'DebuggerStatement': 'debugger'
  , 'ThisExpression': 'this'
  , 'Identifier': 'id'
  , 'Literal': 'literal'
}

function get_children(node) {
  if(!node) {
    return []
  }

  switch(node.type) {
    case 'LabeledStatement':
      return [node.label].concat(node.body)
    case 'BlockStatement':
    case 'Program':
      return node.body

    case 'ExpressionStatement':
      return [node.expression]
    case 'ConditionalExpression':
    case 'IfStatement':
      if(node.alternate)
        return [node.test, node.consequent, node.alternate]
      return [node.test, node.consequent]
    case 'BreakStatement':
    case 'ContinueStatement':
      return node.label ? [node.label] : []
    case 'WithStatement':
      return [node.object].concat(node.body.slice())
    case 'SwitchStatement':
      return [node.discriminant].concat(node.cases.slice())
    case 'ReturnStatement':
    case 'ThrowStatement':
      return node.argument ? [node.argument] : null
    case 'TryStatement':
      var ret = [node.block]
      if(node.handlers.length)
        ret.push(node.handlers[0])
      if(node.finalizer)
        ret.push(node.finalizer)
      return ret
    case 'WhileStatement':
      return [node.test, node.body]
    case 'DoWhileStatement':
      return [node.body, node.test]
    case 'ForStatement':
      return [node.init, node.test, node.update, node.body]
    case 'ForInStatement':
      return [node.left, node.right, node.body]
    case 'FunctionDeclaration':
      return [node.id].concat(node.params).concat([node.body]) 
    case 'VariableDeclaration':
      return node.declarations
    case 'VariableDeclarator':
      if(node.init) return [node.id, node.init]
      return [node.id]
    case 'LogicalExpression':
    case 'BinaryExpression':
    case 'AssignmentExpression':
      return [node.left, node.right]
    case 'ArrayExpression':
      return node.elements
    case 'ObjectExpression':
      return node.properties
    case 'ObjectKeyExpression':
      return [node.key, node.value]
    case 'FunctionExpression':
      return [node.id].concat(node.params).concat([node.body]) 
    case 'SequenceExpression':
      return node.expressions
    case 'UpdateExpression':
    case 'UnaryExpression':
      return [node.argument]

    case 'CallExpression':
    case 'NewExpression':
      return [node.callee].concat(node.arguments || [])

    case 'MemberExpression':
      return [node.object, node.property]

    case 'SwitchCase':
      return [node.test].concat(node.consequent).filter(Boolean)

    case 'CatchClause':
      return [node.param, node.body]

    case 'DebuggerStatement':
    case 'ThisExpression':
    case 'Identifier':
    case 'Literal':
      return []
    case 'Property':
      return [node.key, node.value]
  }

  return []
}
