export const PointsCtrl = class {
  #scene = null;
  constructor({
    scene,
    addBtn,
    toggleBtn,
    deleteBtn,
    classCtrl,
    currentPointName,
    classX,
    classY,
    classZ,
    color,
    diameter,
  }) {
    this.#scene = scene;

    this.color = color || new BABYLON.Color3(0, 1, 0);
    this.diameter = diameter || 5;

    this.current = null;
    this.points = [];
    this.pointMat = new BABYLON.StandardMaterial("pointMat", this.#scene);
    this.pointMat.diffuseColor = this.color;

    this.pointAdded = false;

    this.addBtn = document.querySelector(addBtn);
    this.addBtn.addEventListener("click", this.addPoint.bind(this));

    this.toggleBtn = document.querySelector(toggleBtn);
    this.toggleBtn.style.display = "none";
    this.toggleBtn.addEventListener("click", this.togglePoints.bind(this));

    this.deleteBtn = document.querySelector(deleteBtn);
    this.deleteBtn.style.display = "none";
    this.deleteBtn.addEventListener("click", this.deletePoint.bind(this));

    this.classCtrl = document.querySelector(classCtrl);
    this.classCtrl.style.display = "none";

    this.currentPointName = document.querySelector(currentPointName);

    this.ctrlX = this.classCtrl.querySelector(classX);
    this.ctrlX.addEventListener("change", (e) => {
      this.changeCurPointPos(new BABYLON.Vector3(+e.target.value, this.current.position.y, this.current.position.z));
      if (e.target.value != 0 || this.current.position.y != 0 || this.current.position.z != 0) this.pointAdded = false;
      else this.pointAdded = true;
    });
    this.ctrlY = this.classCtrl.querySelector(classY);
    this.ctrlY.addEventListener("change", (e) => {
      this.changeCurPointPos(new BABYLON.Vector3(this.current.position.x, +e.target.value, this.current.position.z));
      if (this.current.position.x != 0 || e.target.value != 0 || this.current.position.z != 0) this.pointAdded = false;
      else this.pointAdded = true;
    });
    this.ctrlZ = this.classCtrl.querySelector(classZ);
    this.ctrlZ.addEventListener("change", (e) => {
      this.changeCurPointPos(new BABYLON.Vector3(this.current.position.x, this.current.position.y, +e.target.value));
      if (this.current.position.x != 0 || this.current.position.y != 0 || e.target.value != 0) this.pointAdded = false;
      else this.pointAdded = true;
    });

    this.#scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
        const ray = this.#scene.createPickingRay(this.#scene.pointerX, this.#scene.pointerY, BABYLON.Matrix.Identity(), this.#scene.activeCameras[0]);
        const pick = this.#scene.pickWithRay(ray);
        if (pick.hit) {
          const pickedMesh = this.points.find(mesh => mesh === pick.pickedMesh);
          if (pickedMesh) {
            this.setCurrentPoint(pickedMesh);
          }
        }
      }
    });
  }

  addPoint() {
    if (this.pointAdded) return;
    this.pointAdded = true;

    this.pointMat.alpha = 1;

    const pointName = `point-${new Date().getTime()}`;
    const point = BABYLON.MeshBuilder.CreateSphere(pointName, {
      diameter: this.diameter
    }, this.#scene);
    point.isPickable = true;
    point.material = this.pointMat;

    this.addDragBehavior(point);
    
    this.points.push(point);
    this.toggleBtn.style.display = "block";
    this.setCurrentPoint(point);
  }

  addDragBehavior(mesh) {
    const pointerDragBehavior = new BABYLON.PointerDragBehavior({});
    pointerDragBehavior.detachCameraControls = true;
    pointerDragBehavior.onDragStartObservable.add(() => {
      this.#scene.activeCameras[0].detachControl();
    });
    const canvas = this.#scene.getEngine().getRenderingCanvas();
    pointerDragBehavior.onDragEndObservable.add((event) => {
      this.setCurrentPoint(mesh);
      if (event.dragPlanePoint.x != 0 || event.dragPlanePoint.y != 0 || event.dragPlanePoint.z != 0) this.pointAdded = false;
      else this.pointAdded = true;
      this.#scene.activeCameras[0].attachControl(canvas);
    });
    mesh.addBehavior(pointerDragBehavior);
  }

  setCurrentPoint(pointMesh) {
    this.current = pointMesh;
    this.deleteBtn.style.display = "block";
    this.classCtrl.style.display = "block";
    this.currentPointName.innerHTML = pointMesh.name;
    this.ctrlX.value = this.current.position.x;
    this.ctrlY.value = this.current.position.y;
    this.ctrlZ.value = this.current.position.z;
  }

  togglePoints() {
    this.pointMat.alpha = !this.pointMat.alpha;
  }

  changeCurPointPos(position) {
    if (!this.current) return;
    this.current.position = position;
    this.ctrlX.value = position.x;
    this.ctrlY.value = position.y;
    this.ctrlZ.value = position.z;
  }

  deletePoint() {
    if (!this.current) return;
    this.current.dispose();
    if (this.pointAdded) this.pointAdded = false;
    this.points = this.points.filter(point => this.current !== point);
    if (!this.points.length) this.toggleBtn.style.display = "none";
    this.disCurrentPoint();
  }

  disCurrentPoint() {
    this.current = null;
    this.deleteBtn.style.display = "none";
    this.classCtrl.style.display = "none";
  }
}