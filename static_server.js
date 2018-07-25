/**
 * Based on: https://gist.github.com/aolde/8104861
 * which is a fork of: https://gist.github.com/ryanflorence/701407
 * Can't use vanilla http-server, since it doesn't use wasm mime-type, which is required for this to work in FireFox
 */

function error404(response){
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.write("404 Not Found\n");
    response.end();
}

var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs")
    port = process.argv[2] || 3000,
    mimeTypes = {
      "html": "text/html",
      "jpeg": "image/jpeg",
      "jpg": "image/jpeg",
      "png": "image/png",
      "js": "text/javascript",
      "css": "text/css",
      "wasm": "application/wasm",
    };
var publicRoot = process.cwd();
if(process.argv[3]){
    publicRoot = path.join(publicRoot, process.argv[3]);
}
 
http.createServer(function(request, response) {
 
  var uri = url.parse(request.url).pathname;
  var filename = path.join(publicRoot, uri);
  //to prevent directory traversal using ../
  if(!filename.startsWith(publicRoot)){
    return error404(response);
  }
  
  fs.exists(filename, function(exists) {
    if(!exists) {
      return error404(response);
    }
 
    if (fs.statSync(filename).isDirectory()) 
      filename += '/index.html';
 
    fs.readFile(filename, "binary", function(err, file) {
      if(err) {        
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }
      
      var mimeType = mimeTypes[filename.split('.').pop()];
      
      if (!mimeType) {
        mimeType = 'text/plain';
      }
      
      response.writeHead(200, { "Content-Type": mimeType });
      response.write(file, "binary");
      response.end();
    });
  });
}).listen(parseInt(port, 10));

console.log(`Static file server serving files from ${publicRoot} running at http://localhost:${port}/\nCTRL + C to shutdown`);