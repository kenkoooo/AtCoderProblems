# cssauron-falafel

cssauron bindings for falafel / esprima JS ASTs.

It shortens the esprima names they're a bit verbose.

It also supports `.relation` classes -- for example:

```
if(x) {

}

if(x > y) {

}

if(100) {

}
```

If we wanted to select all of the if tests ("x", "x > y", "100"), we could use the
following selectors:

```
if > *:first-child                  // lil verbose!
.test                               // test the relation from the parent, not the node type
if > .test                          // more specific -- only ".test" relations from "if" statements.
```

# node types

    LabeledStatement	    ->	label
    BlockStatement	        ->	block
    Program	                ->	root
    ExpressionStatement	    ->	expr
    ConditionalExpression	->	ternary
    IfStatement	        	->	if
    BreakStatement	    	->	break
    ContinueStatement		->	continue
    WithStatement	    	->	with
    SwitchStatement	    	->	switch
    ReturnStatement	    	->	return
    ThrowStatement	    	->	throw
    TryStatement	    	->	try
    WhileStatement	    	->	while
    DoWhileStatement		->	do-while
    ForStatement	    	->	for
    ForInStatement	    	->	for-in
    FunctionDeclaration		->	function
    VariableDeclaration		->	variable-decl
    VariableDeclarator		->	variable
    LogicalExpression		->	binary
    BinaryExpression		->	binary
    AssignmentExpression	->	assign
    ArrayExpression	    	->	array
    ObjectExpression		->	object
    ObjectKeyExpression		->	key
    FunctionExpression		->	function
    SequenceExpression		->	sequence
    UpdateExpression		->	update
    UnaryExpression	    	->	unary
    CallExpression	    	->	call
    NewExpression	    	->	new
    MemberExpression		->	lookup
    SwitchClause	    	->	case
    CatchClause	        	->	catch
    DebuggerStatement		->	debugger
    ThisExpression	    	->	this
    Identifier	        	->	id
    Literal	            	->	literal

# license

MIT
