# scoped

scoped is a command line tool to help you reason about your javascript.

scoped is also a library that will give you all of the scope information about
a given `falafel`-generated AST! (it even works with `let`!)

```javascript
var scoped = require('scoped')
  , falafel = require('falafel')

falafel('<some javascript>', scoped(function(scope) {
    scope.vars                          // vars declared in this scope
    scope.vars[0].name                  // the name of the var
    scope.vars[0].nodes                 // a list of nodes + kinds of use
    scope.vars[0].nodes[0].kind         // "implicit", "explicit", or "declare"
    scope.vars[0].nodes[0].node         // the esprima AST node.

    scope.children                      // the list of child scopes of this node
    scope.children[0]                   // as an array.

    scope.uses                          // the list of variables that this scope
                                        // "uses" from parent scopes. at top level,
                                        // these are globals.
}))

// you can also tell scoped to ignore certain globals:
falafel('<some javascript>', scoped(['Math', 'module'], function(scope) {

}))

```

it notifies you of globals -- both explicit (created by assigning) and implicit
(use without definition) -- and, when given a position in the file, will let you know
what variables are in scope at that point.

![example scoped output](http://cl.ly/image/0G2M2R0Z093N/scoped.png)

# usage

### scoped path/to/file.js

outputs only global usage/leakage information, with line and column numbers.

### scoped path/to/file.js --position=line[,column]

outputs scope chain, with usage/definition for each scope. `position` is
in the form `LINE,COLUMN`. `,COLUMN` may be omitted, if so, it is assumed
to be `1`. Both `line` and `column` are assumed to be 1-indexed (like most
editors).

* Green `+` signs indicate scope definitions -- i.e., a new variable was created
  in this scope.

* Purple `*` signs indicate use of a variable from a containing scope.

* If the function is named, it will use that to describe the function.

# installation

`npm install -g scoped`

# license

MIT 
