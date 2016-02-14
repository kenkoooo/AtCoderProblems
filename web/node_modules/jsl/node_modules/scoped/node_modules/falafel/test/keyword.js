var falafel = require('../');
var test = require('tape');

test('custom keyword', function (t) {
    t.plan(1);
    
    var src = 't.equal(beep "boop", "BOOP");';
    var opts = {
        isKeyword: function (id) {
            if (id === 'beep') return true;
        }
    };
    
    var output = falafel(src, opts, function (node) {
        if (node.type === 'UnaryExpression'
        && node.operator === 'beep') {
            node.update(
                'String(' + node.argument.source() + ').toUpperCase()'
            );
        }
    });
    Function('t', output)(t);
});
