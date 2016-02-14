var lint = require('./index')()

module.exports = lint

lint
  .rule(require('./checks/maybe-trailing-newline'), 'error')
  .rule(require('./checks/warn-nested-functions'), 'warn')
  .rule(require('./checks/warn-nested-objects'), 'warn')
  .rule(require('./checks/comma-first-object'), 'error')
  .rule(require('./checks/comma-first-array'), 'error')
  .rule(require('./checks/use-single-quotes'), 'error')
  .rule(require('./checks/use-triple-equals'), 'error')
  .rule(require('./checks/comma-first-call'), 'error')
  .rule(require('./checks/trailing-newline'), 'error')
  .rule(require('./checks/use-preincrement'), 'error')
  .rule(require('./checks/warn-too-many-keys').check, 'warn')
  .rule(require('./checks/warn-too-many-keys').flag, 'warn')
  .rule(require('./checks/object-key-format'), 'error')
  .rule(require('./checks/computed-lookup'), 'error')
  .rule(require('./checks/statement-style'), 'error')
  .rule(require('./checks/var-block-order'), 'error')
  .rule(require('./checks/if-return-early'), 'error')
  .rule(require('./checks/function-style'), 'error')
  .rule(require('./checks/if-stmt-order'), 'error')
  .rule(require('./checks/ws-binary-ops'), 'error')
  .rule(require('./checks/ws-unary-ops'), 'error')
  .rule(require('./checks/block-format'), 'error')
  .rule(require('./checks/semicolons'), 'error')
  .rule(require('./checks/no-globals'), 'error')
  .rule(require('./checks/no-eval'), 'error')
  .line(line_length, 'error')
  .line(trailing, 'warning')

function trailing(line_no, line, alert) {
  if(!/\s+$/.test(line)) {
    return
  }

  alert('trailing whitespace')
}

function line_length(line_no, line, alert) {
  if(line.length < 80) {
    return
  }

  alert('lines should not exceed 80 characters')
}
