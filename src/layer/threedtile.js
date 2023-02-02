import Layer from "ol/layer/Layer";
import Source from "ol/source/Source";
import LayerProperty from "ol/layer/Property.js";

const superOptions = {
  render: function () {
    console.log("RENDERING");
  },
};
class Threedtile extends Layer {
  constructor(options) {
    super(superOptions);
    for (const [key, value] of Object.entries(options)) {
      key === "visible"
        ? this.set(LayerProperty.VISIBLE, value)
        : (this.values_[key] = value);
    }
    this.setVisible = function (visible) {
      console.log("THREEDTILEJS, GETVISIBLE", this.getVisible);
      this.set(LayerProperty.VISIBLE, visible);
      this.CesiumTileset.show = !this.CesiumTileset.show;
    };
    this.setSource(new Source({ projection: "EPSG:4326" }));
    (this.getMaxResolution = function () {
      return 10000000;
    }),
      (this.getMinResolution = function () {
        return 0;
      }),
      console.log("THIS IS THREEDTILE", this);
    console.log("THIS SOURCE", this.setSource);
  }
}

const threedtile = function threedtile(options) {
  //const threedtileOptions = Object.assign(layerOptions);

  return new Threedtile(options);
};
export { threedtile, Threedtile };
