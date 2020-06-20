// POSENET DOCUMENTATION
// https://github.com/tensorflow/tfjs-models/tree/master/posenet

//let cnv;

//let video;
//let poseNet;
let poses = [];
let vidScale;
let vidW = 640;
let vidH = 480;
let vidTransX;
let words = ['LAZY', 'POOR', 'AGGRESSIVE', 'LOUD', 'ANGRY'];
let futura;
let currTime;
let startTime;
let period = 10;
let k = 0;
let skeletonIsOn = false;

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

}

function modelReady() {
  select('#status').html('Model Loaded');
}

function draw() {
  currTime = second();
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

  if (currTime % period == 0) {
    k = floor(random(words.length));
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
        if (j == 0) {
          push();
            translate(2*keypoint.position.x,0);
            scale(-1, 1);
            fill(255);  // draw word in white
            textAlign(CENTER, CENTER);
            textFont(futura);
            textSize(40);
            text(words[k], keypoint.position.x, keypoint.position.y);
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