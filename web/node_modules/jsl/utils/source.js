module.exports = function(node) {
  var src = node.src || (node.src = node.source())

  return function(from, to) {
    var bits = src.slice(from - node.range[0], to - node.range[0]).split('')
      , chars_on_line = false
      , last = null
      , line = []
      , out = []
      , ch

    while(bits.length) {
      ch = bits.shift()

      if(ch === '/' && last === '/') {
        line.pop()

        while(bits.length && bits.shift() !== '\n') {
          // noop
        }

        last = null

        ch = chars_on_line ? '\n' : (bits.shift() || '')

        if(/^\s*$/.test(line.slice(1).join(''))) {
          line.length = 1
        }

        chars_on_line = false
      } else if(ch === '*' && last === '/') {
        line.pop()

        while(bits.length && !(last === '*' && bits[0] === '/')) {
          last = bits.shift()
        }

        bits.shift()
        last = null
        ch = bits.shift() || ''
      } else if(ch === '\n') {
        chars_on_line = false
        out = out.concat(line)
        line.length = 0
      } else if(!chars_on_line && !/\s/.test(last || '')) {
        chars_on_line = true
      }

      line.push(ch)
      last = ch
    }

    out = out.concat(line)

    return out.join('')
  }
}
