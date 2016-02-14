var process = require('process')
  , path = require('path')
  , fs = require('fs')

var language = require('cssauron-falafel')
  , concat = require('concat-stream')
  , colors = require('ansicolors')
  , optimist = require('optimist')
  , globals = require('./globals')
  , falafel = require('falafel')

var lookup = optimist.argv._[optimist.argv._.length - 1]
  , target = (optimist.argv._ || [])[0]
  , cwd = process.cwd()
  , output
  , input

if(lookup === target) {
  lookup = []
} else {
  lookup = lookup.split('.')
}

if(!target) {
  process.exit(1)
}

if(target !== '-') {
  target = target[0] === '/' ? target : path.join(cwd, target || '')

  try {
    input = fs.createReadStream(target).pipe(concat(process_file))
  } catch(err) {
    console.error('not a file')
    process.exit(1)
  }
} else {
  process.stdin.pipe(concat(process_file))

  if(process.stdin.paused) {
    process.stdin.resume()  
  }
}

function process_file(input) {
  var pos = null

  input = new Buffer('function module() { ' + input + ' }')

  if(optimist.argv.position) {
    pos = line_col_to_idx.apply(
        null
      , (optimist.argv.position + ',1').split(',').map(Number)
    )
  }

  try {
    falafel(input + '', require('./index')(globals, optimist.attach, done))
  } finally {
  }

  function done(last) {
    var exit_code = handle_globals(last)

    if(pos) {
      handle_position(pos, [last])
    }

    return process.exit(exit_code)
  }

  function handle_globals(top_level) {
    var uses = top_level.uses
      , explicit = 0
      , default_fmt
      , node
      , use
      , fmt

    var formats = {
        'explicit': colors.red
      , 'implicit': colors.yellow
    }

    default_fmt = colors.yellow

    for(var i = 0, len = uses.length; i < len; ++i) {
      use = uses[i]

      for(var j = 0, jlen = use.nodes.length; j < jlen; ++j) {
        node = use.nodes[j]
        fmt = formats[node.kind] || default_fmt

        console.log(
            colors.cyan(
                'L' + pad(
                    idx_to_line_col(node.node.range[0]).line + ''
                  , 6
                )
            )
          , pad(use.name, 30) + fmt(pad(node.kind))
        )

        if(uses[i].nodes[j].kind === 'explicit') {
          ++explicit
        }
      }
    }

    return explicit
  }

  function handle_position(pos, scopes) {
    var chain = []
      , current

    for(var i = 0, len = scopes.length; i < len; ++i) {
      if(scopes[i].scope.range[0] < pos && scopes[i].scope.range[1] > pos) {
        chain.push(scopes[i])
        scopes = scopes[i].children
        i = -1 
        len = scopes.length
      }
    }

    while(chain.length > 1) {
      current = chain.pop()
      print(current, chain.length)
    }

  }

  function print(scope, idx) {
    var from = idx_to_line_col(scope.scope.range[0])
      , to = idx_to_line_col(scope.scope.range[1])
      , name

    name = scope.scope.type.replace(/([A-Z]{1})/g, function(a, m) {
      return ' ' + m.toLowerCase() 
    }).slice(1)

    if(scope.scope.id) {
      name += ': ' + scope.scope.id.name
    }

    if(idx === 1) {
      name = 'program'
    }

    name = colors.yellow('<' + name + '>') + ' from ' + from + ' to ' + to
    console.log(name)

    for(var i = 0, len = scope.vars.length; i < len; ++i) {
      console.log(
          colors.green('+ ') + 
          colors.cyan(pad(
              'L' + idx_to_line_col(
                  scope.vars[i].nodes[0].node.range[0]
              ).line + ''
            , 6
          ))
        , pad(scope.vars[i].name, 24)
        , 'used'
        , (scope.vars[i].nodes.length - 1) + ' time(s)'
      )  

    }

    for(var i = 0, len = scope.uses.length; i < len; ++i) {
      console.log(
          colors.magenta('* ') + 
          colors.cyan(pad(
              'L' + idx_to_line_col(
                  scope.uses[i].nodes[0].node.range[0]
              ).line + ''
            , 6
          ))
        , pad(scope.uses[i].name, 24)
      )  
    }
  }

  function pad(s, n) {
    while(s.length < n) {
      s = s + ' '
    }

    return s.slice(0, n)
  }

  function line_col_to_idx(line, col) {
    line -= 1
    col -= 1

    for(var i = 0, len = input.length; i < len; ++i) {
      if(line && input[i] === 0xA) {
        --line
      }

      if(!line) {
        if(!col) {
          return i
        }

        --col
      }
    }

    return null
  }

  function idx_to_line_col(idx) {
    var columns = 0
      , lines = 0

    for(var i = 0, len = idx; i < len; ++i) {
      ++columns

      if(input[i] === 0xA) {
        ++lines
        columns = 0
      }
    }

    return {line: 1 + lines, col: columns + 1, toString: str}

    function str() {
      return colors.cyan('L' + this.line + ':' + this.col)
    }
  }
}
