var scoped = require('../index')
  , falafel = require('falafel')
  , test = require('tape')
  , path = require('path')
  , fs = require('fs')

require('./cli')

test(
    'test lint rules'
  , require('jsl/rules')
      .test([__filename, path.resolve(__dirname, '..', 'cli.js')])
)

test('test let scope in block', function(assert) {
  falafel(read('let-scope.js'), scoped(ready))

  assert.end()

  function ready(scopes) {
    assert.equal(scopes.children[0].vars.length, 1)
    assert.equal(scopes.children[0].vars[0].name, 'y')
    assert.equal(scopes.children[0].vars[0].nodes.length, 1)
    assert.equal(scopes.children[0].vars[0].nodes[0].kind, 'declare')
    assert.equal(scopes.children[0].scope.type, 'BlockStatement')
    assert.equal(scopes.children[0].scope.parent.type, 'IfStatement')

    assert.equal(scopes.children[1].vars.length, 0)
    assert.equal(scopes.children[1].children.length, 1)
    assert.equal(scopes.children[1].children[0].vars[0].name, 'xxx')
    assert.equal(scopes.children[1].children[0].vars[0].nodes.length, 1)
    assert.equal(
        scopes.children[1].children[0].vars[0].nodes[0].kind
      , 'declare'
    )
    assert.equal(scopes.children[1].children[0].scope.type, 'BlockStatement')
    assert.equal(
        scopes.children[1].children[0].scope.parent.type
      , 'FunctionDeclaration'
    )

    assert.equal(scopes.children[2].vars.length, 1)
    assert.equal(scopes.children[2].vars[0].name, 'i')
    assert.equal(scopes.children[2].vars[0].nodes.length, 4)
    assert.equal(scopes.children[2].vars[0].nodes[0].kind, 'declare')
    assert.equal(scopes.children[2].scope.type, 'ForStatement')

    assert.equal(scopes.children[3].vars.length, 1)
    assert.equal(scopes.children[3].vars[0].name, 'j')
    assert.equal(scopes.children[3].vars[0].nodes.length, 1)
    assert.equal(scopes.children[3].vars[0].nodes[0].kind, 'declare')
    assert.equal(scopes.children[3].scope.type, 'ForInStatement')
  }
})

test('test single var declaration', function(assert) {
  falafel(read('single-var-declaration.js'), scoped(check_vars(assert)))

  assert.end()
})

test('test multiple var declaration', function(assert) {
  falafel(read('var-declaration.js'), scoped(check_vars(assert)))

  assert.end()
})

test('test var hoisting', function(assert) {
  falafel(read('var-hoisting.js'), scoped(ready))

  assert.end()

  function ready(scopes) {
    assert.equal(scopes.uses.length, 0)
    assert.equal(scopes.vars.length, 1)
    assert.equal(scopes.children.length, 0)
    assert.equal(scopes.vars[0].name, 'y')
    assert.equal(scopes.vars[0].nodes.length, 2)
    assert.equal(scopes.vars[0].nodes[0].kind, 'explicit')
    assert.equal(scopes.vars[0].nodes[1].kind, 'declare')
  }
})

test('test function hoisting', function(assert) {
  falafel(read('function-hoisting.js'), scoped(ready))
  falafel(read('function-hoisting.js'), scoped(['Math'], function(scopes) {
    assert.deepEqual(names(scopes.uses), ['dosomething'])
  }))

  assert.end()

  function ready(scopes) {
    var current

    assert.equal(scopes.uses.length, 2)
    assert.deepEqual(names(scopes.uses), ['dosomething', 'Math'])
    assert.deepEqual(nodes_length(scopes.uses), [1, 1])
    assert.deepEqual(nodes_kind(scopes.uses), ['implicit', 'implicit'])
    assert.equal(scopes.vars.length, 1)
    assert.equal(scopes.children.length, 2)
    assert.deepEqual(names(scopes.vars), ['x'])
    assert.deepEqual(
        kinds(scopes.vars[0].nodes)
      , ['implicit', 'declare', 'implicit']
    )

    current = scopes.children[1]

    assert.deepEqual(names(current.vars), ['a', 'b', 'expr', 'x', 'l1'])
  }
})

test('test catch(err) decls', function(assert) {
  falafel(read('try-catch.js'), scoped(ready))

  function ready(scopes) {
    assert.equal(scopes.vars.length, 0)
    assert.equal(scopes.uses.length, 0)
    assert.equal(scopes.children.length, 1)

    scopes = scopes.children[0]
    assert.equal(scopes.vars.length, 1)
    assert.equal(scopes.uses.length, 0)
    assert.equal(scopes.vars[0].name, 'expected')
    assert.equal(scopes.vars[0].nodes.length, 1)

    assert.equal(scopes.vars[0].nodes[0].kind, 'declare')
  }

  assert.end()
})

test('test global bubbling', function(assert) {
  falafel(read('global.js'), scoped(ready))

  assert.end()

  function ready(scopes) {
    assert.equal(scopes.uses.length, 2)
    assert.equal(scopes.uses[0].name, 'explicit')
    assert.equal(scopes.uses[1].name, 'implicit')
    assert.equal(scopes.uses[0].nodes.length, 1)
    assert.equal(scopes.uses[0].nodes[0].kind, 'explicit')
    assert.equal(scopes.uses[1].nodes.length, 1)
    assert.equal(scopes.uses[1].nodes[0].kind, 'implicit')

    // uses bubble up through children,
    // their node references are strictly equal.
    assert.equal(scopes.children[1].uses.length, 1)
    assert.strictEqual(
        scopes.children[1].uses[0].nodes[0].node
      , scopes.uses[1].nodes[0].node
    )
  }
})

function read(filename) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', filename), 'utf8')
}

function check_vars(assert) {
  return function ready(scopes) {
    var current = scopes

    assert.equal(current.vars.length, 5)
    assert.equal(current.children.length, 2)
    assert.deepEqual(names(current.vars), ['a', 'b', 'c', 'test', 'outer'])
    assert.deepEqual(nodes_length(current.vars), [1, 1, 1, 1, 1])
    assert.deepEqual(
        nodes_kind(current.vars)
      , ['declare', 'declare', 'declare', 'declare', 'declare']
    )

    current = scopes.children[0]

    assert.equal(current.vars.length, 4)
    assert.equal(current.children.length, 1)
    assert.deepEqual(names(current.vars), ['x', 'y', 'z', 'inner'])

    assert.deepEqual(nodes_length(current.vars), [1, 1, 1, 1])
    assert.deepEqual(
        nodes_kind(current.vars)
      , ['declare', 'declare', 'declare', 'declare']
    )

    current = current.children[0]
    assert.equal(current.vars.length, 6)
    assert.equal(current.children.length, 0)
    assert.deepEqual(names(current.vars), ['e', 'f', 'g', 's', 't', 'u'])

    assert.deepEqual(nodes_length(current.vars), [1, 1, 1, 1, 1, 1])
    assert.deepEqual(
        nodes_kind(current.vars)
      , ['declare', 'declare', 'declare', 'declare', 'declare', 'declare']
    )

    current = scopes.children[1]
    assert.equal(current.vars.length, 3)
    assert.equal(current.children.length, 0)
    assert.deepEqual(names(current.vars), ['j', 'k', 'l'])
    assert.deepEqual(nodes_length(current.vars), [1, 1, 1])
    assert.deepEqual(
        nodes_kind(current.vars)
      , ['declare', 'declare', 'declare']
    )
  }
}

function nodes_kind(arr) {
  return arr.map(function(x) {
    return x.nodes[0].kind
  })
}

function nodes_length(arr) {
  return arr.map(function(x) {
    return x.nodes.length
  })
}

function names(arr) {
  return arr.map(function(x) {
    return x.name
  })
}

function kinds(arr) {
  return arr.map(function(x) {
    return x.kind
  })
}
