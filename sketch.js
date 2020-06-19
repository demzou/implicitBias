
//let cnv;

//let video;
//let poseNet;
let poses = [];
let vidScale;
let vidW;
let vidH;
let vidTransY;

function centerCanvas() {
  let x = (windowWidth - width) / 2;
  let y = (windowHeight - height) / 2;
  cnv.position(x, y);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  cnv = createCanvas(windowWidth, windowHeight);
  centerCanvas();

  vidW = 640;
  vidH = 480;
  vidScale = width / 640;
  vidTransY = -(480 * vidScale - height) / 2;

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
  background(0);

  // scale up full video feed and what is drawns on the canvas
  translate(0, vidTransY); // recenter video feed vertically
  scale(vidScale, vidScale);

  // mirror video feed
  translate(vidW,0);
  scale(-1, 1);
  
  image(video, 0, 0, vidW, vidH);

  // We can call both functions to draw all keypoints and the skeletons
  drawKeypoints();
  drawSkeleton();
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
        fill(255);
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

