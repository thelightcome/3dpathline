const COLOR_GREEN = new BABYLON.Color4(0, 1, 0, 1);
const COLOR_RED = new BABYLON.Color4(1, 0, 0, 1);
const COLOR_BLUE = new BABYLON.Color4(0, 0, 1, 1);

export const Аxes = class {
  #scene = null;
  #node = null;
  #coneX = null;
  #coneY = null;
  #coneZ = null;
  #axisX = null;
  #axisY = null;
  #axisZ = null;
  constructor(scene, {
    top,
    bottom,
    height,
    length
  }) {
    this.#scene = scene;

    this.top = top || 0.1;
    this.bottom = bottom || 1;
    this.height = height || 3;
    this.length = length || 20;

    this.ctrlX = null;
    this.ctrlY = null;
    this.ctrlZ = null;
    this.ctrlTop = null;
    this.ctrlBottom = null;
    this.ctrlHeight = null;
    this.ctrlLength = null;

    this.#node = new BABYLON.TransformNode("node", this.#scene);

    this.createCones();

    this.createLines();
  }

  createCones() {
    if (this.#coneX) this.#coneX.dispose();
    if (this.#coneY) this.#coneY.dispose();
    if (this.#coneZ) this.#coneZ.dispose();

    this.#coneX = this.createCone("coneX", COLOR_GREEN, "z", -Math.PI / 2, "x");
    this.#coneY = this.createCone("coneY", COLOR_RED, "x", 0, "y");
    this.#coneZ = this.createCone("coneZ", COLOR_BLUE, "x", Math.PI / 2, "z");
  }
  
  createCone(name, color, rotationAx, rotationVal, positionAx) {
    const cone = BABYLON.MeshBuilder.CreateCylinder(name, {
      diameterTop: this.top,
      diameterBottom: this.bottom,
      height: this.height,
      faceColors: [color, color, color],
    }, this.#scene);
    cone.rotation[rotationAx] = rotationVal;
    cone.position[positionAx] = this.length;
    cone.parent = this.#node;
    return cone;
  }

  createLines() {
    this.#axisX = this.createLine("axisX", [new BABYLON.Vector3(-1 * this.length, 0, 0), new BABYLON.Vector3(this.length, 0, 0)], COLOR_GREEN);

    this.#axisY = this.createLine("axisY", [new BABYLON.Vector3(0, -1 * this.length, 0), new BABYLON.Vector3(0, this.length, 0)], COLOR_RED);

    this.#axisZ = this.createLine("axisZ", [new BABYLON.Vector3(0, 0, -1 * this.length), new BABYLON.Vector3(0, 0, this.length)], COLOR_BLUE);
  }
  
  createLine(name, points, color) {
    const axis = BABYLON.MeshBuilder.CreateLines(name, {
      points: points,
      updatable: true
    }, this.#scene);
    axis.color = color;
    axis.parent = this.#node;
    return axis;
  }

  switchAxis(char) {
    let cone, axis;
    
    switch (char) {
      case "X": {
        cone = this.#coneX;
        axis = this.#axisX;
        break;
      }
      case "Y": {
        cone = this.#coneY;
        axis = this.#axisY;
        break;
      }
      case "Z": {
        cone = this.#coneZ;
        axis = this.#axisZ;
        break;
      }
    }

    cone.visibility = cone.visibility === 0 ? 1 : 0;
    axis.alpha = !axis.alpha;
  }

  update({ top, bottom, height, length }) {
    this.top = top || this.top;
    this.bottom = bottom || this.bottom;
    this.height = height || this.height;
    this.length = length || this.length;

    if (top || bottom || height) this.createCones();
    else {
      this.#coneX.position.x = length;
      this.#coneY.position.y = length;
      this.#coneZ.position.z = length;
    }

    if (length) {
      this.#axisX = BABYLON.MeshBuilder.CreateLines("axisX", {
        points: [new BABYLON.Vector3(-1 * length, 0, 0), new BABYLON.Vector3(length, 0, 0)],
        instance: this.#axisX
      }, this.#scene);
      this.#axisY = BABYLON.MeshBuilder.CreateLines("axisY", {
        points: [new BABYLON.Vector3(0, -1 * length, 0), new BABYLON.Vector3(0, length, 0)],
        instance: this.#axisY
      }, this.#scene);
      this.#axisZ = BABYLON.MeshBuilder.CreateLines("axisZ", {
        points: [new BABYLON.Vector3(0, 0, -1 * length), new BABYLON.Vector3(0, 0, length)],
        instance: this.#axisZ
      }, this.#scene);
    }
  }

  addControls({ ctrlX, ctrlY, ctrlZ, ctrlTop, ctrlBottom, ctrlHeight, ctrlLength }) {
    if (ctrlX) {
      this.addControl(ctrlX, "ctrlX", () => {
        this.switchAxis("X");
      });
    }
    
    if (ctrlY) {
      this.addControl(ctrlY, "ctrlY", () => {
        this.switchAxis("Y");
      });
    }
    
    if (ctrlZ) {
      this.addControl(ctrlZ, "ctrlZ", () => {
        this.switchAxis("Z");
      });
    }
    
    if (ctrlTop) {
      this.addControl(ctrlTop, "ctrlTop", (e) => {
        this.update({ top: +e.target.value });
      });
    }
    
    if (ctrlBottom) {
      this.addControl(ctrlBottom, "ctrlBottom", (e) => {
        this.update({ bottom: +e.target.value });
      });
    }
    
    if (ctrlHeight) {
      this.addControl(ctrlHeight, "ctrlHeight", (e) => {
        this.update({ height: +e.target.value });
      });
    }
    
    if (ctrlLength) {
      this.addControl(ctrlLength, "ctrlLength", (e) => {
        this.update({ length: +e.target.value });
      });
    }
  }

  addControl(className, type, handler) {
    if (this[type] && this[type].node) {
      this[type].node.removeEventListener("change", this[type].handler);
    }

    const node = document.querySelector(className);

    if (node) {
      node.addEventListener("change", handler);
      this[type] = {
        node: node,
        handler: handler
      };
    }
  }

  setParent(mesh) {
    this.#node.parent = mesh;
  }
}