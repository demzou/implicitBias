// Required libraries
const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');

// Callback function to handle requests
function handleRequest(req, res) {
    // What did we request?
    let pathname = req.url;
   
    // If blank let's ask for index.html
    if (pathname == "/") {
      pathname = "/index.html";
    }
   
    // Ok what's our file extension
    const ext = path.extname(pathname);
   
    // Map extension to file type
    const typeExt = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css"
    };
   
    // What is it?  Default to plain text
    const contentType = typeExt[ext] || "text/plain";
   
    // Read the file from disk
    fs.readFile(__dirname + pathname,
      // Callback function for reading
      function(err, data) {
        // if there is an error return error report
        if (err) {
          res.writeHead(500);
          return res.end("Error loading " + pathname);
        }
        
        // Otherwise, send the data, the contents of the file
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
      }
    );
  }

// Start the server
let server = http.createServer(handleRequest);
const port = process.env.PORT || 3000;
server.listen(port);
console.log('Server started on port ' + port); 



// Setup sockets with the HTTP server
const socketio = require('socket.io');
let io = socketio.listen(server);
console.log("Listening for socket connections");


// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
  // Callback function to call whenever a socket connection is made
  function (socket) {
    // Print message to the console indicating that a new client has connected
    console.log("We have a new client: " + socket.id);
 
    // Specify a callback function to run every time we get a message of
    // type 'mousedata' from the client
    socket.on('mouseclick',
      function(data) {
        // Data comes in as whatever was sent, including objects
        console.log("Received: 'mouseclick' " + data.status+ " " + data.x + " " + data.y);
      
        // Send it to all other clients
        socket.broadcast.emit('mouseclick', data);
      }
    );

    socket.on('rectangle',
    function(data) {
      // Data comes in as whatever was sent, including objects
      console.log("Received: 'rectangle' " + data);
    
      // Send it to all other clients
      socket.broadcast.emit('rectangle', data);
    }
  );

  socket.on('word',
  function(data) {
    // Data comes in as whatever was sent, including objects
    console.log("Received: 'word': " + data);
  
    // Send it to all other clients
    socket.broadcast.emit('word', data);
  }
);

socket.on('point',
function(data) {
  // Data comes in as whatever was sent, including objects
  console.log("Received: 'target point': " + data);

  // Send it to all other clients
  socket.broadcast.emit('point', data);
}
);
    
    // Specify a callback function to run when the client disconnects
    socket.on('disconnect',
      function() {
        console.log("Client has disconnected");
      }
    );
  }
);