// POSENET DOCUMENTATION
// https://github.com/tensorflow/tfjs-models/tree/master/posenet

//let cnv;

console.log(jeff);

//let video;
//let poseNet;
let socket;
const serverURL = 'https://implicit-bias.herokuapp.com/';
//const serverURL = 'localhost:3000';
let poses = [];
let vidScale;
let vidW = 640;
let vidH = 480;
let vidTransX;
let word = 'HELLO!';
let futura;
let k = 0;
let skeletonIsOn = false;
let localMouseOn = false;
let remoteMouseOn = false;
let circleX;
let circleY;
let rectangleOn = false;
let targetPoint = 0; // default = 0 (nose)


function preload() {
  futura = loadFont('assets/Futura-CondensedExtraBold-05.ttf');
}

function centerCanvas() {
  let x = (windowWidth - width) / 2;
  let y = (windowHeight - height) / 2;
  cnv.position(x, y);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  cnv = createCanvas(windowWidth, windowHeight);
  centerCanvas();

  vidScale = height / 480;
  vidTransX = (vidW * vidScale - width) / 2;

  video = createCapture(VIDEO);
  video.size(vidW, vidH);

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, modelReady);
  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on('pose', function(results) {
    poses = results;
  });
  // Hide the video element, and just show the canvas
  video.hide();

  socket = io.connect(serverURL);

  // Specify a function to call every time 'mouseclick'
  // packets are received over the socket
  socket.on("mouseclick", function(data) {
    // When we receive data draw a blue circle
    console.log("Got: " + data.status + " " + data.x + " " + data.y);
    remoteMouseOn = data.status;
    circleX = data.x;
    circleY = data.y;
  });

  socket.on("rectangle", function(data) {
    console.log("Got: " + data);
    rectangleOn = data;
  });

  socket.on("word", function(data) {
    console.log("Word received: " + data);
    word = data;
  });

  socket.on("point", function(data) {
    console.log("Target point received: " + data);
    targetPoint = data;
  });


}

function modelReady() {
  select('#status').html('Model Loaded');
}

function draw() {

  push();
  background(0);

  // scale up full video feed and what is drawns on the canvas
  translate(-vidTransX, 0); // recenter video feed horizontally
  scale(vidScale, vidScale);

  // mirror video feed
  translate(vidW,0);
  scale(-1, 1);

  image(video, 0, 0, vidW, vidH);

  // We can call both functions to draw all keypoints and the skeletons
  if (skeletonIsOn) {
    drawSkeleton();
    drawKeypoints();
}
  drawWord();
  pop();


  if (remoteMouseOn == true) {
    console.log("Got in var: " + remoteMouseOn + " " + circleX + " " + circleY);
    push();
    fill(0, 0, 255);
    ellipse(circleX, circleY, 80, 80);
    pop();
  }

  if (rectangleOn == true) {
    push();
    fill(0, 0, 255);
    rect(width/2, height/2, 100, 100);
    pop();
  }

}

// A function to draw ellipses over the detected keypoints
function drawKeypoints()  {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    let pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j++) {
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      let keypoint = pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        if (j == 0) {
          fill(0);  // draw noise in black
        } else {
          fill(255);
        }
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
    }
  }
}

// A function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  for (let i = 0; i < poses.length; i++) {
    let skeleton = poses[i].skeleton;
    // For every skeleton, loop through all body connections
    for (let j = 0; j < skeleton.length; j++) {
      let partA = skeleton[j][0];
      let partB = skeleton[j][1];
      stroke(255);
      strokeWeight(2);
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  }
}

function windowResized() {
  centerCanvas();
}

function drawWord() {

  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    let pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j++) {
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      let keypoint = pose.keypoints[j];
      // Only draw if the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        if (j == targetPoint) {
          push();
            translate(2*keypoint.position.x,0);
            scale(-1, 1);
            fill(255);  // draw word in white
            textAlign(CENTER, CENTER);
            textFont(futura);
            textSize(40);
            text(word, keypoint.position.x, keypoint.position.y);
          pop();
        } 
      }
    }
  }
}

function keyPressed() {
  if (key === ' ') {
    skeletonIsOn = !skeletonIsOn;
  }
}

function mouseReleased() {
  localMouseOn = false;
  sendMouseData(localMouseOn, 10, 10);
}

function mouseDragged() {
  localMouseOn = true;
  // Send the mouse data to the server
  sendMouseData(localMouseOn, mouseX, mouseY);
}

// Function for sending data to the socket
function sendMouseData(mstatus, xpos, ypos) {
  console.log("sent: " + mstatus + " " + xpos + " " + ypos);

  // Make a JS object with the x and y data
  const data = {
    status: mstatus,
    x: xpos,
    y: ypos
  };

  // Send that object to the socket
  socket.emit("mouseclick", data);
}