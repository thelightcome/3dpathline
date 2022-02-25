class SectionData {
  constructor(startAt, options) {
    this.start = startAt;
    this.options = options;
  }
};

function createSection(points, startSection, nextSection, props) {
  const railsFrom = startSection.start;
  let railsTo = nextSection.start;
  if (nextSection.start === 0) {
    railsTo = points.length;
  }
  const nbRails = railsTo - railsFrom;
  const initialLean = (startSection.options.lean === undefined) ? 0 : startSection.options.lean;
  const initialTurn = (startSection.options.turn === undefined) ? 0 : startSection.options.turn;
  let leanTwists = (startSection.options.leanTwists === undefined) ? 0 : startSection.options.leanTwists;
  let leanWaves = (startSection.options.leanWaves === undefined) ? 0 : startSection.options.leanWaves;
  const leanWaveAngle = (startSection.options.leanWaveAngle === undefined) ? 0 : startSection.options.leanWaveAngle;
  let turnTwists = (startSection.options.turnTwists === undefined) ? 0 : startSection.options.turnTwists;
  let turnWaves = (startSection.options.turnWaves === undefined) ? 0 : startSection.options.turnWaves;
  const turnWaveAngle = (startSection.options.turnWaveAngle === undefined) ? 0 : startSection.options.turnWaveAngle;
  const finalLean = (nextSection.options.lean === undefined) ? 0 : nextSection.options.lean;
  const finalTurn = (nextSection.options.turn === undefined) ? 0 : nextSection.options.turn;
  if (leanWaves > 0 && Math.abs(leanTwists) > 0) {
    if (leanWaveAngle == 0) {
      leanWaves = 0;
    } else {
      leanTwists = 0;
    }
  }
  if (turnWaves > 0 && Math.abs(turnTwists) > 0) {
    if (turnWaveAngle == 0) {
      turnWaves = 0;
    } else {
      turnTwists = 0;
    }
  }
  const rotationMatrixY = BABYLON.Matrix.Identity();
  const rotationMatrixZ = BABYLON.Matrix.Identity();
  const rotationMatrix = BABYLON.Matrix.Identity();
  let tilt = 0;
  let swivel = 0;
  const deltaPhi = (finalLean + 2 * leanTwists * Math.PI - initialLean) / (nbRails);
  const deltaTheta = (finalTurn + 2 * turnTwists * Math.PI - initialTurn) / (nbRails);
  let phi = initialLean;
  let theta = initialTurn;
  const initialRailDirection = BABYLON.Axis.X;
  const initialUprightDirection = BABYLON.Axis.Y;
  const initialLevelDirection = BABYLON.Axis.Z;
  const railDirection = BABYLON.Vector3.Zero();
  const uprightDirection = BABYLON.Vector3.Zero();
  const levelDirection = BABYLON.Vector3.Zero();
  const carriageNormal = BABYLON.Vector3.Zero();
  BABYLON.Vector3.TransformNormalToRef(initialRailDirection, rotationMatrix, railDirection);
  const rotationMatrixLean = BABYLON.Matrix.Identity();
  const rotationMatrixTurn = BABYLON.Matrix.Identity();
  const rotationMatrixPassenger = BABYLON.Matrix.Identity();
  const rotation = BABYLON.Matrix.Identity();
  const gradLean = (finalLean - initialLean) / (nbRails - 1);
  const gradTurn = (finalTurn - initialTurn) / (nbRails - 1);
  let railCount = 0;
  for (let i = railsFrom; i < railsTo; i++) {
    points[(i + 1) % points.length].subtractToRef(points[i], railDirection);
    railDirection.normalize();
    swivel = -Math.atan2(railDirection.z, railDirection.x);
    tilt = Math.atan2(Math.abs(railDirection.y), Math.abs(railDirection.x));
    tilt *= Math.sign(railDirection.y);
    BABYLON.Matrix.RotationAxisToRef(BABYLON.Axis.Y, swivel, rotationMatrixY);
    BABYLON.Matrix.RotationAxisToRef(BABYLON.Axis.Z, tilt, rotationMatrixZ);
    rotationMatrixZ.multiplyToRef(rotationMatrixY, rotationMatrix);
    BABYLON.Vector3.TransformNormalToRef(initialUprightDirection, rotationMatrix, uprightDirection);
    BABYLON.Vector3.TransformNormalToRef(initialLevelDirection, rotationMatrix, levelDirection);
    uprightDirection.normalize();
    levelDirection.normalize();
    if (leanWaves > 0) {
      phi = initialLean + railCount * gradLean + leanWaveAngle * Math.sin(railCount * leanWaves * Math.PI / (nbRails - 1));
    } else {
      phi += deltaPhi;
    }
    if (turnWaves > 0) {
      theta = initialTurn + railCount * gradTurn + turnWaveAngle * Math.sin(railCount * turnWaves * Math.PI / (nbRails - 1));
    } else {
      theta += deltaTheta;
    }
    railCount++;
    BABYLON.Matrix.RotationAxisToRef(railDirection, phi, rotationMatrixLean);
    BABYLON.Vector3.TransformNormalToRef(uprightDirection, rotationMatrixLean, carriageNormal);
    BABYLON.Matrix.RotationAxisToRef(carriageNormal, theta, rotationMatrixTurn);
    BABYLON.Matrix.RotationAxisToRef(initialUprightDirection, theta, rotationMatrixPassenger);
    props.passengerRotations.push(rotationMatrixPassenger.clone());
    rotationMatrix.multiplyToRef(rotationMatrixLean, rotation);
    props.carriageRotations.push(rotation.clone());
    rotation.multiplyToRef(rotationMatrixTurn, rotation);
    props.rotations.push(rotation.clone())
    props.directions.push(railDirection.clone());
  }
}

function createTrack(points, sections) {
  const props = {
    directions: [],
    rotations: [],
    carriageRotations: [],
    passengerRotations: [],
  }

  let nbSections = sections.length;

  const looped = (sections[nbSections - 1].start === 0);
  for (let i = 1; i < nbSections - looped; i++) {
    if (sections[i - 1].start > sections[i].start) {
      console.log("sections not in order");
      return;
    }
  }
  if (0 < sections[nbSections - 1].start && sections[nbSections - 2].start > sections[nbSections - 1].start) {
    console.log("last section not in order");
    return;
  }
  let section = sections[0];
  if (section.start > 0) {
    sections.unshift(new SectionData(0, {}));
    nbSections = sections.length;
  }
  if (0 < sections[nbSections - 1].start && sections[nbSections - 1].start < points.length - 1) {
    sections.push(new SectionData(0, sections[0].options));
  }
  for (let i = 0; i < sections.length - 1; i++) {
    createSection(points, sections[i], sections[i + 1], props);
  }

  return props;
}

export const createPath = (points, sectionsObj, opt = {
  deltaI: 0,
  speed: 0.5
}) => {
  const sections = sectionsObj.map(obj => {
    return new SectionData(obj.point, obj.option);
  });

  const track = createTrack(points, sections);

  let deltaI = opt.deltaI;
  const speed = opt.speed;
  const drag = Math.round(1 / speed);
  const pace = Math.round(speed);
  const nbPoints = points.length;

  const positions = [];
  const rotations = [];
  const brotations = [];
  const zeroVector = BABYLON.Vector3.Zero();

  let i = 0;
  while (i < nbPoints) {
    if (speed >= 1) {
      body.rotationQuaternion = BABYLON.Quaternion.FromRotationMatrix(track.passengerRotations[i]);
      positions.push(points[i]);
      rotations.push(BABYLON.Quaternion.FromRotationMatrix(track.carriageRotations[i]));
      brotations.push(BABYLON.Quaternion.FromRotationMatrix(track.passengerRotations[i]));
      i += pace;
    } else {
      zeroVector.x = points[i].x + deltaI * (points[(i + 1) % nbPoints].x - points[i].x) / drag;
      zeroVector.y = points[i].y + deltaI * (points[(i + 1) % nbPoints].y - points[i].y) / drag;
      zeroVector.z = points[i].z + deltaI * (points[(i + 1) % nbPoints].z - points[i].z) / drag;
      positions.push(zeroVector.clone());
      rotations.push(BABYLON.Quaternion.FromRotationMatrix(track.carriageRotations[i]));
      brotations.push(BABYLON.Quaternion.FromRotationMatrix(track.passengerRotations[i]));
      i = (Math.floor(i + (deltaI + 1) / drag));
      deltaI = (deltaI + 1) % drag;
    }
  }

  return {
    positions,
    rotations,
    brotations
  };
}