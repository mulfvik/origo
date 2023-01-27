import Layer from "ol/layer/Layer";

class Threedtile {
  constructor(options) {
    for (const [key, value] of Object.entries(options)) {
      this[key] = value;
    }
  }
}

const threedtile = function threedtile(layerOptions) {
  const dummySource = {
    on: function () {
      console.log("dummySource");
    },
  };
  const threedtileDefault = {
    layerType: "threedtile",
    once: function () {
      console.log("THREEDTILEJS, ONCE");
    },
    on: function (type, listener) {
      console.log("TYPE", type, "LISTENER", listener);
    },
    getLayerStatesArray: function () {},
    addEventListener: function () {},
    getVisible: function () {
      console.log("THREEDTILEJS, GETVISIBLE");
      console.log(this.visible);
      return this.visible;
      //return true;
    },
    setVisible: function (visible) {
      console.log("THREEDTILEJS, SETVISIBLE");
      console.log("THIS IN SETVISIBLE ", this);
      this.visible = visible;
      this.CesiumTileset.show = !this.CesiumTileset.show;
    },
    getSource: function () {
      return dummySource;
    },
    get: function (getwhat) {
      if (getwhat === "name") {
        console.log("GETWHAT", getwhat, this.name);
        return this.name;
      } else if (getwhat === "title") {
        return this.title;
      } else if (getwhat === "group") {
        return this.group;
      } else if (getwhat === "expanded") {
        return this.expanded;
      }
    },
    getSelectionGroupTitle: function () {
      return this.name;
    },
    getOpacity: function () {
      return 1;
    },
    getMaxResolution: function () {
      return 10000000;
    },
    getMinResolution: function () {
      return 0;
    },
    on: function () {},
    getZIndex: function () {},
  };
  const threedtileOptions = Object.assign(threedtileDefault, layerOptions);

  return new Threedtile(threedtileOptions);
};

export { threedtile, Threedtile };
