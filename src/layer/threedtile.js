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
    once: function () {},
    getLayerStatesArray: function () {},
    addEventListener: function () {},
    getVisible: function () {},
    getSource: function () {
      return dummySource;
    },
    get: function (getwhat) {
      if (getwhat === "name") {
        return this.name;
      }
    },
    getSelectionGroupTitle: function () {
      return this.name;
    },
    getOpacity: function () {},
    getMaxResolution: function () {},
    getMinResolution: function () {},
    on: function () {},
    getZIndex: function () {},
  };
  const threedtileOptions = Object.assign(threedtileDefault, layerOptions);

  return new Threedtile(threedtileOptions);
};

export { threedtile, Threedtile };
