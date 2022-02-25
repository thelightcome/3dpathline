export const PathCamera = class {
  #scene = null;
  constructor(scene, { pathLookCtrl, scissors }) {
    this.#scene = scene;

    this.camBox = this.getCamBox();

    this.linesPoints = [
      new BABYLON.Vector3(0, 0, 0),
      new BABYLON.Vector3(40, 0, 0),
    ];

    this.setLine(this.linesPoints);

    this.targetSphere = this.getTargetSphere(this.linesPoints);

    this.camera1 = this.#scene.activeCameras[0];

    const canvas = this.#scene.getEngine().getRenderingCanvas();
    this.pathCam = this.getPathCam(this.linesPoints, canvas);

    this.pathLookBtn = document.querySelector(pathLookCtrl);
    this.scissors = document.querySelector(scissors);
    
    this.pathLook = false;
    this.pathLookBtn.addEventListener("click", this.toggleCamera.bind(this));

    this.percent = 0;
    this.percentSpeed = 0.1;
    this.curPoint = 0;
    this.targetPoint = 0;
    this.dir = 1;

    this.positions = [];
    this.rotations = [];

    window.addEventListener("wheel", (e) => {
      this.dir = Math.sign(e.deltaY);
      let next = this.percent + this.dir * this.percentSpeed;
      if (next < 0) next = 0;
      this.percent = next % 100;
      this.targetPoint = Math.floor(this.positions.length * this.percent / 100);
    });

    this.#scene.registerBeforeRender(() => { 
      if (this.curPoint !== this.targetPoint) {
        if (this.curPoint + this.dir < 0) return;
        this.curPoint = (this.curPoint + this.dir) % this.positions.length;
        if (this.positions[this.curPoint]) this.camBox.position = this.positions[this.curPoint];
        if (this.rotations[this.curPoint]) this.camBox.rotationQuaternion = this.rotations[this.curPoint];
      }
    });
  }

  getCamBox() {
    const camBoxMat = new BABYLON.StandardMaterial("camBoxMat", this.#scene);
    camBoxMat.diffuseColor = new BABYLON.Color3(0, 0, 1);

    const camFaceColors = [
      new BABYLON.Color4(1, 0, 0, 1),
      new BABYLON.Color4(0, 1, 0, 1),
      new BABYLON.Color4(0, 0, 1, 1),
      new BABYLON.Color4(1, 1, 0, 1),
      new BABYLON.Color4(0, 1, 1, 1),
      new BABYLON.Color4(1, 0, 1, 1),
    ];

    const camBox = BABYLON.MeshBuilder.CreateBox("camBox", { width: 10, height: 1, depth: 5, faceColors: camFaceColors }, this.#scene);
    camBox.material = camBoxMat;
    return camBox;
  }

  setLine(linesPoints) {
    const lines = BABYLON.MeshBuilder.CreateLines("lines", { points: linesPoints }, this.#scene);
    lines.parent = this.camBox;
  }

  getTargetSphere(linesPoints) {
    const targetSphereMat = new BABYLON.StandardMaterial("targetSphereMat", this.#scene);
    targetSphereMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.1);
    const targetSphere = BABYLON.MeshBuilder.CreateSphere("targetSphere", { radius: 0.5 }, this.#scene);
    targetSphere.material = targetSphereMat;
    targetSphere.position = linesPoints[1];
    targetSphere.parent = this.camBox;
    return targetSphere;
  }

  getPathCam(linesPoints, canvas) {
    const pathCam = new BABYLON.UniversalCamera("pathCam", linesPoints[0], this.#scene);
    pathCam.setTarget(linesPoints[1]);
    pathCam.parent = this.camBox;
    // pathCam.attachControl(canvas);
    this.#scene.activeCameras.push(pathCam);
    this.#scene.activeCameras[0].viewport = new BABYLON.Viewport(0, 0, 0.5, 1);
    this.#scene.activeCameras[1].viewport = new BABYLON.Viewport(0.5, 0, 1, 1);
    return pathCam;
  }

  toggleCamera() {
    this.pathLook = !this.pathLook;
    this.scissors.classList.toggle("hidden");
    if (this.pathLook) {
      this.#scene.activeCameras = [this.pathCam];
      this.pathCam.viewport = new BABYLON.Viewport(0, 0, 1, 1);
    } else {
      this.#scene.activeCameras = [this.camera1, this.pathCam];
      this.camera1.viewport = new BABYLON.Viewport(0, 0, 0.5, 1);
      this.pathCam.viewport = new BABYLON.Viewport(0.5, 0, 1, 1);
    }
  }

  setFirstState({ position, rotation }) {
    this.camBox.position = position || new BABYLON.Vector3(0, 0, 0);
    this.camBox.rotationQuaternion = rotation || new BABYLON.Quaternion(0, 0, 0, 0);
  }

  setPath({ positions, rotations }) {
    this.positions = positions;
    this.rotations = rotations;
  }

  getPagesPoint(pagesPoints) {
    const camBoxPos = this.camBox.position;
    const camBoxRot = this.camBox.rotationQuaternion;
    const pagesOptions = pagesPoints.map((pagePoint) => {
      this.camBox.position = pagePoint.position.clone();
      this.camBox.rotationQuaternion = pagePoint.rotation.clone();
      this.targetSphere.computeWorldMatrix(true);
      return {
        point: pagePoint.point,
        position: this.targetSphere.getAbsolutePosition().clone(),
        rotationQuaternion: this.camBox.rotationQuaternion.multiplyInPlace(new BABYLON.Quaternion.RotationYawPitchRoll(0, Math.PI, 0)),
      };
    });

    this.camBox.position = camBoxPos;
    this.camBox.rotationQuaternion = camBoxRot;

    return pagesOptions;
  }
}