// "x" should be defined everywhere"
x()

function x() {
  x()
}

// "expr" should only be defined within
// itself, along with "a" and "b"
dosomething(function expr(a, b) {
  if(true) {
    for(var x = 0; x < 10; ++x) {
      try {
        Math.max(x, 1)
      } catch(err) { 
        var l1 = 1
      }
    }
  } 
})
