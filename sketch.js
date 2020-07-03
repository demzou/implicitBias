// POSENET DOCUMENTATION
// https://github.com/tensorflow/tfjs-models/tree/master/posenet


let cnv;

//let video;
//let poseNet;
let socket;
const serverURL = 'https://implicit-bias.herokuapp.com/';
//const serverURL = 'localhost:3000';
let poses = [];
let receivedPose;
let vidScale;
let vidW = 640;
let vidH = 480;
let vidTransX;
let word = 'HELLO!';
let futura;
let k = 0;
let skeletonIsOn = false;
let targetPoint = 0; // default = 0 (nose)
let mode = 0;
let pairId = 0;
let t = 0;
let speed = 0.001;
let userPoint = 0;
let partnerPoint = 0;
let pointPair1 = 0;
let pointPair2 = 0;


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

  socket.on("word", function(data) {
    console.log("Word received: " + data);
    word = data;
  });

  socket.on("point", function(data) {
    console.log("Target point received: " + data);
      targetPoint = data;
  });

  socket.on("pointPair1", function(data) {
    console.log("Target point pair 1 received: " + data);
      pointPair1 = data;
      updateConnectedPoints();
  });

  socket.on("pointPair2", function(data) {
    console.log("Target point pair 2 received: " + data);
      pointPair2 = data;
      updateConnectedPoints();
  });

  socket.on("mode", function(data) {
    console.log("Mode received: " + data);
    mode = data;
  });

  socket.on("pose", function(data) {
    //console.log("Pose received: " + data);
    receivedPose = data;
  });

  socket.on("pairId", function(data) {
    console.log("Pair ID: " + data);
    pairId = data;
    updateConnectedPoints();
  });

  socket.on("speed", function(data) {
    console.log("Speed: " + data);
    speed = data;
  });

  socket.on("timer", function(data) {
    console.log("Timer: " + data);
    t = data;
  });

}

function modelReady() {
  select('#status').html('Model Loaded');
}

function draw() {

  background(0);

  push();

  // scale up full video feed and what is drawns on the canvas
  translate(-vidTransX, 0); // recenter video feed horizontally
  scale(vidScale, vidScale);

  // mirror video feed
  translate(vidW,0);
  scale(-1, 1);

  image(video, 0, 0, vidW, vidH);

  //----- HELLO!
  if (mode == 0) {
    if(poses[0]) {
      if (skeletonIsOn) {
        if (poses.length > 0){
          drawSkeleton(poses[0], color(255));
          drawKeypoints(poses[0], color(255));
        }
      }
      drawWord();
    } 
  }

  //----- SHAPE
  if (mode == 1 || mode == 2) {
    if(poses[0]) {
      drawShape();
      //movingShape();
    }
  }

  //----- WORDS
  if (mode == 3) {
    if(poses[0]) {
      drawWord();
    }
  }  

  //----- PARTNERS
  if (mode == 4) {

    if (poses[0]){
      drawSkeleton(poses[0], color(255));
      drawHead(poses[0], color(255));
      //drawKeypoints(poses[0], color(255));
      socket.emit("pose", poses[0]);
      //console.log(poses[0]);
    }
    if (receivedPose){
      drawSkeleton(receivedPose, color(0, 255, 255));
      drawHead(receivedPose, color(0, 255, 255));
      //drawKeypoints(receivedPose, color(255, 0, 0));  
      if (poses[0]) {
        connectPoints();
      }
      
    }
    pop();

    partneringInstructions()
    
  }

  if (mode == 2) {
      movingShape();
  }

}

// A function to draw ellipses over the detected keypoints
function drawKeypoints(_poses, _c)  {
  push();
  // Loop through all the poses detected
  //for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    //let pose = poses[i].pose;
    let pose = _poses.pose;
    for (let j = 0; j < pose.keypoints.length; j++) {
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      let keypoint = pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        if (j == 0) {
          fill(0);  // draw noise in black
        } else {
          fill(_c);
        }
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
    }
  //}
  pop();
}

// A function to draw the skeletons
function drawSkeleton(_poses, _c) {
  push();
  // Loop through all the skeletons detected
  // for (let i = 0; i < _poses.length; i++) {
  //   let skeleton = _poses[i].skeleton;
    let skeleton = _poses.skeleton;
    // For every skeleton, loop through all body connections
    for (let j = 0; j < skeleton.length; j++) {
      let partA = skeleton[j][0];
      let partB = skeleton[j][1];
      stroke(_c);
      strokeWeight(2);
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  //}
  pop();
}

function drawHead(_poses, _c) {
  push();
  let pose = _poses.pose;
    // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    let nose = pose.keypoints[0];
    let leftShoulder = pose.keypoints[5];
    let rightShoulder = pose.keypoints[6];
    let size = 100;
    size = int(dist(leftShoulder.position.x, leftShoulder.position.y, rightShoulder.position.x, rightShoulder.position.y) * 0.8);
    stroke(_c);
    noFill();
    strokeWeight(2);
    if (nose.score > 0.2) {
      ellipse(nose.position.x, nose.position.y, size, size);
    }
  pop();
}



function drawWord() {
    let pose = poses[0].pose;
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      let keypoint = pose.keypoints[targetPoint];
      // Only draw if the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        push();
          translate(2*keypoint.position.x,0);
          scale(-1, 1);

          fill(0, 100, 255, 100);
          noStroke();
          ellipse(keypoint.position.x, keypoint.position.y, 140, 140);

          fill(255);  // draw word in white
          textAlign(CENTER, CENTER);
          textFont(futura);
          textSize(28);
          text(word, keypoint.position.x, keypoint.position.y);
        pop();
      }
 }


 function drawShape() {
  let pose = poses[0].pose;
    // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    let keypoint = pose.keypoints[targetPoint];
    // Only draw if the pose probability is bigger than 0.2
    if (keypoint.score > 0.2) {
      push();
        translate(2*keypoint.position.x,0);
        scale(-1, 1);
        stroke(0, 255, 255);
        noFill();
        strokeWeight(4);
        ellipse(keypoint.position.x, keypoint.position.y, 60, 60);
      pop();
    }
}

function movingShape() {
  push();
  t+= speed;
  let x = vidW * noise(t + 1);
  let y = vidH * noise(t + 400);
  noStroke();
  fill(255, 255, 0, 150);
  ellipse(x, y, 100, 100);
  pop();
}

function updateConnectedPoints() {
  if (pairId == 1) {
    userPoint = pointPair1;
    partnerPoint = pointPair2;
  }

  if (pairId == 2) {
    userPoint = pointPair2;
    partnerPoint = pointPair1;
  }
}

function connectPoints() {

  push();

  let keypointUser = poses[0].pose.keypoints[userPoint];
  let keypointPartner = receivedPose.pose.keypoints[partnerPoint];

    fill(255, 255, 0);
    noStroke();
    ellipse(keypointUser.position.x, keypointUser.position.y, 20, 20);
    ellipse(keypointPartner.position.x, keypointPartner.position.y, 20, 20);
    stroke(255, 255, 0);
    strokeWeight(4);
    line(keypointUser.position.x, keypointUser.position.y, keypointPartner.position.x, keypointPartner.position.y);


  

  pop();
 }

function partneringInstructions() {

  push();
    if (pairId == 1) {
      fill(255); 
      noStroke();
      rectMode(CENTER);
      rect(width/4, 42, 280, 28);
      fill(0);
      textAlign(CENTER, CENTER);
      textFont(futura);
      textSize(20);
      text("STAND ON THE LEFT", width/4, 40);
    } else if (pairId == 2) {
      fill(255); 
      noStroke();
      rectMode(CENTER);
      rect(width/4*3, 42, 280, 28);
      fill(0);
      textAlign(CENTER, CENTER);
      textFont(futura);
      textSize(20);
      text("STAND ON THE RIGHT", 3*width/4, 40);
    } else {
      fill(0, 100);
      rect(0, 0, width, height);
      fill(255); 
      textAlign(CENTER, CENTER);
      textFont(futura);
      textSize(30);
      text("WAITING FOR PARTNER...", width/2, height/2);
    }
    stroke(255, 150);
    strokeWeight(2);
    line(width/2, 0, width/2, height)
    pop();

}


function keyPressed() {
  if (key === ' ') {
    skeletonIsOn = !skeletonIsOn;
  }
}

function windowResized() {
  centerCanvas();
}