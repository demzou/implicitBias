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
const { match } = require('assert');
let io = socketio.listen(server);
console.log("Listening for socket connections");

// PAIRING FUNCTIONS
const clientPairs = []
const unmatchedClients = []

const matchClients = (id1, id2) => {
  clientPairs.push({
    id1, id2
  })
  console.log("pairs: " + clientPairs)
  let a = 1;
  let b = 2;
  io.to(id1).emit('pairId', a);
  io.to(id2).emit('pairId', b);
}

const addUnmatchedClient = (id) => {
  unmatchedClients.push(id);
  console.log("Umatched clients: " + unmatchedClients);

  if (unmatchedClients.length >= 2) {
    matchClients(unmatchedClients[0], unmatchedClients[1]);
    unmatchedClients.splice(0,2);
    console.log("Umatched clients: " + unmatchedClients)
  }
}


const removeClient = (clientId) => {

  // Check if client waiting in unmatched list
  if (unmatchedClients.length > 0) {
    for (let i= 0; i < unmatchedClients.length; i++) {
      if (unmatchedClients[i] === clientId) {
        unmatchedClients.splice(i, 1);
        console.log("Client removed from unmatched, new list: " + unmatchedClients)
        return
      }
    }
  } 

  // Check if part of a pair
  // Then add other partner to unmatched list
  // Then remove pair
  for (let i= 0; i < clientPairs.length; i++){
    if (clientPairs[i].id1 === clientId) {
      addUnmatchedClient(clientPairs[i].id2);
      clientPairs.splice(i,1);
      console.log("Pair removed, new list: " + clientPairs + "Unmatched list: " + unmatchedClients)

    } else if (clientPairs[i].id2 === clientId){
      addUnmatchedClient(clientPairs[i].id1);
      clientPairs.splice(i,1);
      console.log("Pair removed, new list: " + clientPairs + "Unmatched list: " + unmatchedClients)

    } else {
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
    console.log("We have a new client: " + socket.id + " room: " + socket.rooms + " client: " + socket.client);
    addUnmatchedClient(socket.id);
    // Specify a callback function to run every time we get a message of
    // type 'mousedata' from the client
    socket.on('mouseclick',
      function(data) {
        // Data comes in as whatever was sent, including objects
        console.log("Received: 'mouseclick' " + data.status+ " " + data.x + " " + data.y + " by " + socket.id);
      
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

socket.on('mode',
function(data) {
  // Data comes in as whatever was sent, including objects
  console.log("Received: 'mode': " + data);

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
  console.log("Removing all pairs and unmatched users: " + data);

  clientPairs = [];
  unmatchedClients = [];
);
    
    // Specify a callback function to run when the client disconnects
    socket.on('disconnect',
      function() {
        console.log("Client has disconnected - Socket: " + socket + " socket ID: " + socket.id);
        removeClient(socket.id);
      }
    );
  }
);