var lines = require('./vendor/line-stream')
  , language = require('cssauron-falafel')
  , subsource = require('./utils/source')
  , concat = require('concat-stream')
  , falafel = require('falafel')
  , through = require('through')

module.exports = linter

function replace(args) {
  return function(all, match) {
    var match_args = match.slice(0, -1)
      , type = match[match.length - 1]

    switch(type) {
      case 'r': return JSON.stringify(args.shift())
      case 's': return args.shift() + ''
      case 'd': return args.shift() | 0
      case 'f': return args.shift().toFixed(match_args[match_args.length - 1])
      case 'x': return (+args.shift() || 0).toString(16)
    }
    return args.shift()
  }
}

function linter() {
  var line_rules = []
    , ast_rules = []
    , types = []

  stream_factory.rule = add_ast
  stream_factory.line = add_line_rule
  stream_factory.transform = require('./as/bfy-transform')(stream_factory)
  stream_factory.requireExt = require('./as/require-ext')(stream_factory)
  stream_factory.test = require('./as/test')(stream_factory)
  stream_factory.cli = require('./as/cli')(stream_factory)

  return stream_factory

  function stream_factory() {
    var stream = through(write, end)
      , cat = concat(safely(parse))
      , line_number = 0
      , line = lines()
      , output = {}
      , filedata

    for(var i = 0, len = types.length; i < len; ++i) {
      output[types[i]] = []
    }

    line.on('data', safely(check_line))

    return stream

    function check_line(line) {
      ++line_number

      for(var i = 0, len = line_rules.length; i < len; ++i) {
        line_rules[i].exec(
            line_number
          , line
          , line_rules[i].make_error(output, line_number)
        )
      }
    }

    function parse(_filedata) {
      filedata = _filedata + ''

      falafel(filedata, function(node) {
        node.start = to_line_col(node.range[0])
        node.end = to_line_col(node.range[0] + node.source().length)
        node.src = node.source()

        for(var i = 0; i < ast_rules.length; ++i) {
          var check = ast_rules[i]

          if(check.selector(node)) {
            check.exec(node, subsource, check.make_error(output))
          }
        }
      })

      function to_line_col(pos) {
        var column = 0
          , line = 1

        for(var i = 0; i <= pos; ++i) {
          ++column

          if(filedata[i] === '\n') {
            ++line
            column = 0
          }
        }

        return {line: line, col: column}
      }

    }

    function safely(perform) {
      return function(buf) {
        try {
          return perform(buf)
        } catch(err) {
          stream.emit('error', err)
        }
      }
    }

    function write(buf) {
      cat.write(buf)
      line.write(buf)
    }

    function end() {
      var iter = types.slice()
        , type
        , next

      cat.end()
      line.end()

      while(iter.length) {
        type = iter.shift()

        while(output[type].length) {
          next = output[type].shift()
          next.type = type
          stream.queue(next)
        }
      }

      stream.queue(null)
    }
  }

  function add_ast(selector, exec, level) {
    if(arguments.length === 2) {
      level = exec
      exec = selector
      selector = exec.selector
    }

    if(typeof selector === 'string') {
      selector = language(selector)
    }

    if(typeof selector !== 'function') {
      throw new Error(
          'selector for ' + (exec.name || '<anonymous>') +
          ' must be a function:' + selector
      )
    }

    if(types.indexOf(level) === -1) {
      types.push(level)
    }

    ast_rules.push({
        selector: selector
      , make_error: make_error
      , exec: exec
    })

    return this

    function make_error(output) {
      return function make_error(node, message) {
        output[level] = output[level] || []
        output[level].push({
            type: level
          , line: node.start.line
          , col: node.start.col
          , message: message.replace(
                /%([\d\.]*\w{1})/g
              , replace([].slice.call(arguments, 2))
            )
        })
      }
    }
  }

  function add_line_rule(check, level) {
    if(types.indexOf(level) === -1) {
      types.push(level)
    }

    line_rules.push({
        exec: check
      , make_error: make_error
    })

    return this

    function make_error(output, line_number) {
      return function make_error(message) {
        output[level] = output[level] || []
        output[level].push({
            type: level
          , line: line_number
          , col: 0
          , message: message.replace(
                /%([\d\.]*\w{1})/g
              , replace([].slice.call(arguments, 2))
            )
        })
      }
    }
  }
}
