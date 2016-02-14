var lang = require('./index')
  , is_forloop = lang('for')
  , is_while = lang('while + do-while')
  , is_ident = lang('id:contains(y)') 
  , results = {}

var find_test = lang('for > .test')

var falafel = require('falafel')

function test() {
  var y = 3
    , z

  for(var i = 0; i < len; ++i) {
    
  }

  for(;0;);

  while(0);

  do { } while(0);
}


falafel(test+'', function(node) {
  if(is_forloop(node)) {
    (results.is_forloop = results.is_forloop || []).push(node.source())
  }
  if(is_while(node)) {
    (results.is_while = results.is_while || []).push(node.source())
  }
  if(is_ident(node)) {
    (results.is_ident = results.is_ident || []).push(node.source())
  }
  if(find_test(node)) {
    console.log(node, '---!')
  }
})

console.log(results)
