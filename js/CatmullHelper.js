import { createPath } from "./helpFunction.js";

const defaultOptions = [
  {
    index: 0,
    lean: 0,
    leanTwists: 0,
    leanWaves: 0,
    leanWaveAngle: 0,
    turn:  0,
    turnTwists: 0,
    turnWaves: 0,
    turnWaveAngle: 0
  },
  {
    index: 1,
    lean: 0,
    leanTwists: 0,
    leanWaves: 0,
    leanWaveAngle: 0,
    turn: Math.PI / 4,
    turnTwists: 0,
    turnWaves: 0,
    turnWaveAngle: 0
  },
  {
    index: 2,
    lean: 0.1,
    leanTwists: 0,
    leanWaves: 0,
    leanWaveAngle: 0,
    turn: -Math.PI / 4,
    turnTwists: 0,
    turnWaves: 0,
    turnWaveAngle: 0
  },
  {
    index: 3,
    lean: 0,
    leanTwists: 0,
    leanWaves: 0,
    leanWaveAngle: 0,
    turn: -Math.PI / 6,
    turnTwists: 0,
    turnWaves: 0,
    turnWaveAngle: 0
  },
];

export const CatmullHelper = class {
  #scene = null;
  constructor(scene, {
    ctrl,
    toggleCtrl,
    pointsCtrl
  }) {
    this.#scene = scene;

    this.pointsMeshes = [];

    this.shiftActive = false;

    this.callbacks = [];

    document.addEventListener("keydown", (e) => {
      if (e.keyCode === 16 && !this.shiftActive) {
        this.pointsMeshes = [];
        this.shiftActive = true;
      }
    });

    this.pointsCtrl = pointsCtrl;

    let selected = false;
    this.#scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
        const ray = this.#scene.createPickingRay(this.#scene.pointerX, this.#scene.pointerY, BABYLON.Matrix.Identity(), this.#scene.activeCameras[0]);
        const pick = this.#scene.pickWithRay(ray);
        if (pick.hit) {
          const pickedMesh = this.pointsCtrl.points.find(mesh => mesh === pick.pickedMesh);
          if (pickedMesh) {
            if (this.shiftActive) this.pointsMeshes.push(pickedMesh);
            else selected = true;
          }
        }
      }
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERUP) {
        selected = false;
      }
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE && selected) {
        this.draw();
      }
    });

    document.addEventListener("keyup", (e) => {
      if (e.keyCode === 16 && this.shiftActive) {
        this.shiftActive = false;
        this.draw();
      }
    });

    this.spline = null;

    this.toggleCtrl = document.querySelector(toggleCtrl);
    this.toggleCtrl.addEventListener("click", () => {
      if (this.spline) this.spline.alpha = !this.spline.alpha;
    });

    this.nbPoints = 100;

    this.ctrl = document.querySelector(ctrl);
    this.ctrl.value = this.nbPoints;
    this.ctrl.addEventListener("change", (e) => {
      if (+e.target.value < 1) return e.target.value = this.nbPoints;
      this.nbPoints = +e.target.value;
      this.draw();
    });

    this.splineColor = new BABYLON.Color4(1, 0, 0, 1);

    this.pointsCount = 1000;
    this.pagesCount = 8;

    this.cameraPath = {
      positions: [],
      rotations: [],
      pagesPoints: []
    };
  }

  draw() {
    if (this.pointsMeshes.length < 2) return;
    this.cameraPath = this.setCameraPath();
    if (this.spline) this.spline = BABYLON.MeshBuilder.CreateLines("spline", { points: this.cameraPath.positions, updatable: true, instance: this.spline }, this.#scene);
    else {
      this.spline = BABYLON.MeshBuilder.CreateLines("spline", { points: this.cameraPath.positions, updatable: true }, this.#scene);
      this.spline.color =  this.splineColor;
    }
    this.callbacks.forEach(func => func());
  }

  setCameraPath() {
    const sections = this.getSections();
    const path3d = this.getPath3dPoints();
    const path = createPath(path3d, sections, {
      deltaI: 0,
      speed: 0.8,
    });
    const del = path.positions.length / this.pointsCount;
    const pagesPoints = sections.map(section => {
      const index = section.point * del;
      return {
        point: index,
        position: path.positions[index],
        rotation: path.rotations[index],
      };
    });
    return {
      pagesPoints: pagesPoints,
      ...path
    };
  }

  getSections() {
    const sections = [];
    const step = Math.floor(this.pointsCount / this.pagesCount);
    for (let i = 0; i < this.pagesCount; i += 1) {
      sections.push({
        point: i * step,
        option: defaultOptions[Math.floor(Math.random() * defaultOptions.length)]
      });
    }
    return sections;
  }

  getPath3dPoints() {
    const path3d = new BABYLON.Path3D(this.getCatmullPositions());
    const points = [];
    const step = 1 / this.pointsCount;
    for (let i = 0; i < this.pointsCount; i += 1) {
      points.push(path3d.getPointAt(i * step));
    }
    return points;
  }

  getCatmullPositions() {
    return BABYLON.Curve3.CreateCatmullRomSpline(this.getMeshPositions(), this.nbPoints, true).getPoints();
  }

  getMeshPositions() {
    return this.pointsMeshes.map(mesh => mesh.position.clone());
  }
}