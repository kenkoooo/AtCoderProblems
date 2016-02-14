var assert = require('assert')
  , cssauron = require('../index')
  , language

var tests = [
    test_select_single      // all of the selectors by themselves
  , test_select_multiple    // all of the combinators
]

start()

function setup() {
  language = cssauron({
      id: 'id'
    , class: 'class'
    , tag: 'tag'
    , attr: 'attr[attr]'
    , parent: 'parent'
    , children: 'children' 
    , contents: 'contents || ""'
  })
}

// integration tests because reasons.

function test_select_single() {
  var data = {id: 'one-id', class: 'one-class', tag: 'one-tag', attr:{first: 'test', second:'gary busey', third:'richard-m-nixon'}, parent:null, children:[]}

  assert.ok(language('#one-id')(data))
  assert.ok(!language('#one-id-false')(data))
  assert.ok(language('.one-class')(data))
  assert.ok(!language('.one-other-class')(data))
  assert.ok(language('one-tag')(data))
  assert.ok(!language('two-tag')(data))
}

function test_select_multiple() {
  var data = {id: 'one-id', class: 'one-class', tag: 'one-tag', attr:{first: 'test', second:'gary busey', third:'richard-m-nixon'}, parent:null, children:[]}
    , data2 = {id: 'two-id', class: 'two-class', tag: 'two-tag', attr:{first: 'test', second:'gary busey', third:'richard-m-nixon'}, parent:null, children:[]}
    , data3 = {id: 'three-id', class: 'three-class', tag: 'three-tag', attr:{first: 'test', second:'gary busey', third:'richard-m-nixon'}, parent:null, children:[]}
    , parent = {id: 'parent-id', class: 'parent-class', tag: 'parent-tag', attr:{first: 'test', second:'gary busey', third:'richard-m-nixon'}, parent:null, children:[data, data2, data3]} 
    , root = {id: 'root-id', class: 'root-class', tag: 'root-tag', attr:{first: 'test', second:'gary busey', third:'richard-m-nixon'}, parent:null, children:[parent]} 

  data.parent = parent
  data2.parent = parent
  data3.parent = parent
  data2.contents = 'hello world'
  parent.parent = root

  assert.ok(language('#root-id #one-id')(data))
  assert.ok(language('#nope,#root-id #one-id')(data))
  assert.ok(!language('#nope, #nada')(data))
  assert.ok(!language('#root-id > #one-id')(data))
  assert.ok(language('#root-id > #parent-id > #one-id')(data))
  assert.ok(language('#parent-id > #one-id,\n#root-id > #parent-id > #one-id')(data))
  assert.ok(language('#ok,\n    #parent-id > #one-id,\n#root-id > #parent-id > #one-id')(data))
  assert.ok(language('.one-class + .two-class')(data2))
  assert.ok(!language('.one-class + #one-id')(data))
  assert.ok(language('one-tag ~ #three-id')(data3))
  assert.ok(language('one-tag:first-child')(data))
  assert.ok(language('one-tag:empty')(data))
  assert.ok(!language('#parent-id:empty')(parent))
  assert.ok(!language('one-tag:last-child')(data))
  assert.ok(language('three-tag:last-child')(data3))
  assert.ok(language('[first]')(data))
  assert.ok(!language('[dne]')(data))
  assert.ok(language('[third|=m]')(data))
  assert.ok(language('[third|=richard]')(data))
  assert.ok(language('[third|=nixon]')(data))
  assert.ok(!language('[third|=tricky-dick]')(data))
  assert.ok(language('[third$=nixon]')(data))
  assert.ok(!language('[third$=dixon]')(data))
  assert.ok(!language('[third^=dick]')(data))
  assert.ok(language('[third^=richard]')(data))
  assert.ok(language('[third*=-m-]')(data))
  assert.ok(!language('[third*=radical]')(data))
  assert.ok(!language('[second~=dne]')(data))
  assert.ok(language('[second~=gary]')(data))
  assert.ok(language('[second~=busey]')(data))
  assert.ok(!language(':contains(hello)')(data))
  assert.ok(!language(':contains(world)')(data))
  assert.ok(language(':contains(hello)')(data2))
  assert.ok(language(':contains(world)')(data2))

  assert.ok(
      language(':root > :any(thing-tag, parent-tag, #asdf) > #one-id')(data)
  )

}

// utils

function out(what) {
  process.stdout.write(what)
}

// test runner

function start() {
  Function.prototype.before = function(fn) {
    var self = this
    return function ret() {
      var args = [].slice.call(arguments)

      fn.call(ret, args)

      return self.apply(this, args)
    }
  }

  if(typeof window !== 'undefined') {
    out = function(s) {
      out.buf = (out.buf || '') + s
      if(!!~s.indexOf('\n')) {
        console.log(out.buf)
        out.buf = ''
      }
    }
  }
  run()
}

function run() {
  if(!tests.length)
    return out('\n')

  var test = tests.shift()
    , now = Date.now()

  setup()

  out(test.name+' - ')
  test.length ? test(done) : (test(), done())

  function done() {
    out(''+(Date.now() - now)+'ms\n')
    run()
  }
}

function pathed(path, value) {
  var root = {}
    , obj = root
    , bits = path.split('.')

  while(bits.length > 1) {
    (obj = obj[bits.shift()] = {})
  }

  obj[bits.shift()] = value
  return root
}

