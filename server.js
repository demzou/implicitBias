// Required libraries
const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
let mode = 0;
let targetPoint = 0;
let word = 'HELLO!';
let pointPair1 = 0;
let pointPair2 = 0;

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
const { match } = require('assert');
let io = socketio.listen(server);
console.log("Listening for socket connections");

// PAIRING FUNCTIONS
let clientPairs = []
let unmatchedClients = []

const matchClients = (id1, id2) => {
  clientPairs.push({
    id1, id2
  })
  console.log("Total clients: " + (clientPairs.length*2 + unmatchedClients.length) + " Pairs: " + clientPairs.length + " Umatched : " + unmatchedClients.length)
  let a = 1;
  let b = 2;
  io.to(id1).emit('pairId', a);
  io.to(id2).emit('pairId', b);
}

const addUnmatchedClient = (id) => {
  unmatchedClients.push(id);

  if (unmatchedClients.length >= 2) {
    matchClients(unmatchedClients[0], unmatchedClients[1]);
    unmatchedClients.splice(0,2);
    console.log("Total clients: " + (clientPairs.length*2 + unmatchedClients.length) + " Pairs: " + clientPairs.length + " Umatched : " + unmatchedClients.length)
  } else {
    console.log("Total clients: " + (clientPairs.length*2 + unmatchedClients.length) + " Pairs: " + clientPairs.length + " Umatched : " + unmatchedClients.length)
  }
}


const removeClient = (clientId) => {

  // Check if client waiting in unmatched list
  if (unmatchedClients.length > 0) {
    for (let i= 0; i < unmatchedClients.length; i++) {
      if (unmatchedClients[i] === clientId) {
        unmatchedClients.splice(i, 1);
        console.log("Total clients: " + (clientPairs.length*2 + unmatchedClients.length) + " Pairs: " + clientPairs.length + " Umatched : " + unmatchedClients.length)
        return
      }
    }
  } 

  // Check if part of a pair
  // Then add other partner to unmatched list
  // Then remove pair
  for (let i= 0; i < clientPairs.length; i++){
    if (clientPairs[i].id1 === clientId) {
      io.to(clientPairs[i].id2).emit('pairId', 0);
      io.to(clientPairs[i].id2).emit('pose', 0);
      addUnmatchedClient(clientPairs[i].id2);
      clientPairs.splice(i,1);
      
      console.log("Total clients: " + (clientPairs.length*2 + unmatchedClients.length) + " Pairs: " + clientPairs.length + " Umatched : " + unmatchedClients.length)

    } else if (clientPairs[i].id2 === clientId){
      io.to(clientPairs[i].id1).emit('pairId', 0);
      io.to(clientPairs[i].id1).emit('pose', 0);
      addUnmatchedClient(clientPairs[i].id1);
      clientPairs.splice(i,1);
      console.log("Total clients: " + (clientPairs.length*2 + unmatchedClients.length) + " Pairs: " + clientPairs.length + " Umatched : " + unmatchedClients.length)

    } else {
      console.log("Total clients: " + (clientPairs.length*2 + unmatchedClients.length) + " Pairs: " + clientPairs.length + " Umatched : " + unmatchedClients.length)
      return
    }
  }

}


const partnerId = (clientId) => {
  for (let i= 0; i < clientPairs.length; i++){
    if (clientPairs[i].id1 === clientId) {
      return clientPairs[i].id2
    } else if (clientPairs[i].id2 === clientId){
      return clientPairs[i].id1
    } else {
      return false
    }
  }
} 


// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
  // Callback function to call whenever a socket connection is made
  function (socket) {
    // Print message to the console indicating that a new client has connected
    console.log("We have a new client: " + socket.id);
    io.to(socket.id).emit('mode', mode);
    io.to(socket.id).emit('point', targetPoint);
    io.to(socket.id).emit('word', word);
    io.to(socket.id).emit('pointPair1', pointPair1);
    io.to(socket.id).emit('pointPair2', pointPair2);
    addUnmatchedClient(socket.id);

    
  socket.on('clientname',
  function(data) {
      if (data === 'iammax'){
        console.log("Max is connected, removing...");
        removeClient(socket.id);
      }      
    }
  );

  socket.on('speed',
  function(data) {
    console.log("Received: 'speed': " + data);
    socket.broadcast.emit('speed', data);
    }
  );

  socket.on('timer',
  function(data) {
    console.log("Received: 'timer': " + data);
    socket.broadcast.emit('timer', data);
    }
  );

  socket.on('word',
  function(data) {
    // Data comes in as whatever was sent, including objects
    console.log("Received: 'word': " + data);
    word = data;
  
    // Send it to all other clients
    socket.broadcast.emit('word', data);
  }
);

socket.on('point',
function(data) {
  // Data comes in as whatever was sent, including objects
  console.log("Received: 'target point': " + data);
  targetPoint = data;

  // Send it to all other clients
  socket.broadcast.emit('point', data);
  }
);

socket.on('pointPair1',
function(data) {
  console.log("Received: 'target point Pair 1': " + data);
  pointPair1 = data;
  socket.broadcast.emit('pointPair1', data);
  }
);

socket.on('pointPair2',
function(data) {
  console.log("Received: 'target point Pair 2': " + data);
  pointPair2 = data;
  socket.broadcast.emit('pointPair2', data);
  }
);

socket.on('mode',
function(data) {
  // Data comes in as whatever was sent, including objects
  console.log("Received: 'mode': " + data);
  mode = data;

  // Send it to all other clients
  socket.broadcast.emit('mode', data);
  }
);

socket.on('pose',
function(data) {
  // Data comes in as whatever was sent, including objects
  //console.log("Received: 'pose': " + data);
  let receiverId = partnerId(socket.id);
  if (receiverId != 0){
  // Send it to other client in pair only
  io.to(receiverId).emit('pose', data);
    //socket.broadcast.emit('pose', data);
  }
 }
);

socket.on('removePartners',
function(data) {
  // Data comes in as whatever was sent, including objects
  console.log("Removing all pairs and unmatched users..");

  clientPairs = [];
  unmatchedClients = [];

  console.log("Total clients: " + (clientPairs.length*2 + unmatchedClients.length) + " Pairs: " + clientPairs.length + " Umatched : " + unmatchedClients.length)

}
);
    
    // Specify a callback function to run when the client disconnects
    socket.on('disconnect',
      function() {
        console.log("Client has disconnected - Socket ID: " + socket.id);
        removeClient(socket.id);
      }
    );
  }
);