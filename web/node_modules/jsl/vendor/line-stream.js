var through = require('through');

module.exports = function(transform){
  
  var buf = "";
  var s = through(function data(data){

    var i, start = 0,line;
    if(Buffer.isBuffer(data)) data = data.toString('utf8');
    buf += data;

    while ((i = buf.indexOf("\n",start)) >= 0) {
      line = buf.substr(0,i);
      if(transform) line = transform(line);
      if(line === undefined) return;
      this.queue(line);
      buf = buf.substr(i+1);
    }

  },function end(){
     if(buf.length) this.queue(buf);
     buf = "";
     this.queue(null);
  });
  return s;
}

