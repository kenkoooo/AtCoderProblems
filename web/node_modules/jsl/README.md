# jsl

an esprima-based, modular linter. by default, it installs some comma-first
rules, but it's designed to let you build your own linter easily.

# api

### lint = require('linter')
### lint() -> Linter

create a new linter.

### Linter.rule(selectNodeFunction, handleNodeFunction, errorLevel) -> Linter

`selectNodeFunction :: Function(AST Node) -> Boolean` -- determines whether to run
`handleNodeFunction` on a given node, "selecting" the node. `selectNodeFunction`
may also be a [CSSauron-Falafel](http://npm.im/cssauron-falafel) style selector
string.

```javascript
var lint = require('jsl')
  , linter

linter = lint()

linter.rule(function(node) { return !!node.params }, ..., 'error')
linter.rule('function > block > expr:first-child:last-child', ..., 'warn') 
```

`handleNodeFunction :: Function(AST Node, subsourceFunction, alertFunction)` -- 
once a node has been selected, determine whether or the node fails any style
checks. It receives the node in question, as well as a `subsource` function and
an `alert` function. `alert` produces messages at the selected error level, while
subsource makes it easy to select ranges of strings while ignoring comments between
nodes.

```javascript
var lint = require('jsl')
  , linter

linter = lint()

linter.rule('array', function(node, subsource, alert) {
  var sub = subsource(node)
    , src

  // given `[a, b, c]`, `sub` will select:
  //          ^^
  // and return ', '.
  src = sub(node.elements[0].range[1], node.elements[1].range[0])

  // alert takes a node on which to attach the 
  // notification; a format string, and subsequent
  // arguments to place into the format string.
  alert(node, 'saw %r', src) 
}, 'general info')

```

### Linter.rule(handleNodeFunction, errorLevel) -> Linter 

If `handleNodeFunction` has a **`.selector`** property, it will be used.

This is primarily to enable simple `require`'s.

```javascript
// linter.js

linter.rule(require('./contrived-test'), 'warning')

// contrived-test.js

module.exports = contrived

// select the right descendant of any binary
// operator:
contrived.selector = 'binary > * + *'

function contrived(node, subsource, alert) {
  alert(node, 'never use binary expressions because reasons')
}
```

### Linter.line(handleLineFunction, errorLevel) -> Linter

Handle a line of the file as a simple text chunk.

```javascript

linter.line(function(line_number, line_string, alert) {
  if(line_string.length > 80) {
    alert('this line is too long.')
  }
}, 'error')

```

### Linter() -> linterStream()

By invoking `Linter`, you receive a through stream that takes file data
and emits messages:

```javascript
{ type: String // "level" that the rule was assigned when given to the linter
, line: Number
, col: Number
, message: String // the message emitted
}
```

### Linter.cli(exit=process.exit)

Run the linter as a CLI. The CLI will accept any number of files, run the linter on
them, and output messages. If rules with a level of `"error"` emit messages, the
CLI will exit with a non-zero exit code. It can be provided an optional exit function;
if none is provided it will call `process.exit` with the number of error-level violations.


### Linter.test(fileList[, readyCallback]) -> Function

Given an array of entry points, create a function that takes `assert` and runs
the linter against your repository.

```javascript
var test = require('tape')
  , your_rules = require('your-rules')

test('repository lints', your_rules.test([__filename])) 

```

### Linter.transform()

**TODO**

Install a browserify transform that lints files as they come through, and if there
are style violations, emits errors and halts compilation (borrowing a page from Go's
book).

# license

MIT
