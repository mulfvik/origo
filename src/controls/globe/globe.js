import * as Cesium from "cesium";
import OLCesium from "olcs/OLCesium";
import proj4 from "proj4";
import { Component, Button, dom, Element as El } from "../../ui";
import getAttributes from "../../getattributes";
import flatpickr from "flatpickr";
import Point from "ol/geom/Point";
import Feature from "ol/Feature";

import { Threedtile } from "../../layer/threedtile";

// ol-cesium depends on a global Cesium
window.Cesium = Cesium;

const Globe = function Globe(options = {}) {
  let { target, globeOnStart, showGlobe = true } = options;

  const {
    resolutionScale = window.devicePixelRatio,
    settings = {},
    cesium3dTiles,
    cesiumTerrainProvider,
    cesiumIontoken,
    cesiumIonassetIdTerrain,
  } = options;

  let map;
  let viewer;
  let oGlobe;
  let oGlobeTarget;
  let terrain;
  let tileset;
  let featureInfo;
  let globeEl;
  let globeButton;
  let fp;
  let flatpickrEl;
  let flatpickrButton;
  let scene;
  let htmlString;
  let el;
  let silhouetteBlue;
  const buttons = [];

  // Toggles between 2D and 3D
  const toggleGlobe = () => {
    // Check if map projection is EPSG:4326 or EPSG:3857.
    // If map has other projection, don't activate globe and console error
    if (
      viewer.getProjectionCode() === "EPSG:4326" ||
      viewer.getProjectionCode() === "EPSG:3857"
    ) {
      oGlobe.setEnabled(!oGlobe.getEnabled());
    } else {
      console.error(
        "Map projection must be EPSG:4326 or EPSG:3857 to be able to use globe mode."
      );
    }
  };

  // Init map with globe or not
  const activeGlobeOnStart = () => {
    const activeOnStart = globeOnStart
      ? toggleGlobe()
      : oGlobe.setEnabled(false);
    return activeOnStart;
  };

  // Renders the globe or not, only effects the terrain and raster overlays on it
  const showGlobeOption = () => {
    if (!showGlobe) {
      scene.globe.show = false;
    }
  };

  // To use Cesium Ion features token needs to be provided in config option "token"
  Cesium.Ion.defaultAccessToken = cesiumIontoken;

  // TODO
  // Put the cesium credits in origo credits container in origo style
  const cesiumCredits = () => {
    document.querySelectorAll(
      ".cesium-credit-logoContainer"
    )[0].parentNode.style.display = "none";
  };

  // Terrain providers
  const terrainProviders = () => {
    if (cesiumTerrainProvider) {
      terrain = new Cesium.CesiumTerrainProvider({
        requestVertexNormals: true,
        // Add as option for 3D Tiles request
        // requestWaterMask: true,
        url: cesiumTerrainProvider,
      });
      scene.terrainProvider = terrain;
    } else if (cesiumIonassetIdTerrain && cesiumIontoken) {
      terrain = new Cesium.CesiumTerrainProvider({
        requestVertexNormals: true,
        // Add as option for 3D Tiles request
        // requestWaterMask: true,
        url: Cesium.IonResource.fromAssetId(cesiumIonassetIdTerrain),
      });
      scene.terrainProvider = terrain;
    } else if (cesiumIontoken) {
      // Cesium world terrain is used as default if token is present
      terrain = Cesium.createWorldTerrain({
        requestVertexNormals: true,
      });
      scene.terrainProvider = terrain;
    }
  };

  // Hides 3D tiles elements by id, not in use, using filter instead
  // TODO
  // Create helper to get array of id's from defined bbox or polygon
  const hide3DtilesById = (ids, tilesets) => {
    const elementid = "${elementId} === ";
    const conditions = [];
    ids.forEach((id) => {
      conditions.push([elementid + id, false]);
    });
    conditions.push([true, true]);
    tilesets.style = new Cesium.Cesium3DTileStyle({
      show: {
        conditions,
      },
    });
  };

  // 3D tiles providers
  const cesium3DtilesProviders = () => {
    const layers = map.getLayers();
    for (const layer of layers.array_) {
      if (layer instanceof Threedtile) {
        let layerTileset;

        const url = layer.values_.url;
        let shadows = layer.values_.shadows;
        let conditions =
          layer.values_.style !== "default" ? layer.values_.style : undefined;
        let show = layer.values_.filter || "undefined";
        if (typeof url === "number" && cesiumIontoken) {
          layerTileset = new Cesium.Cesium3DTileset({
            url: Cesium.IonResource.fromAssetId(url),
            instanceFeatureIdLabel: layer.values_.name,
            maximumScreenSpaceError: layer.values_.maximumScreenSpaceError,
            showOutline: layer.values_.outline || false,
            dynamicScreenSpaceError: true,
            dynamicScreenSpaceErrorDensity: 0.00278,
            dynamicScreenSpaceErrorFactor: 4.0,
            dynamicScreenSpaceErrorHeightFalloff: 0.25,
            shadows, // SHADOWS PROBLEM Is this working?
            show: layer.values_.visible,
          });
        } else if (layer.values_.url === "OSM-Buildings") {
          layerTileset = new Cesium.createOsmBuildings({
            instanceFeatureIdLabel: layer.values_.name,
            shadows, // SHADOWS PROBLEM Is this working?
            show: layer.values_.visible,
          });
        } else {
          layerTileset = new Cesium.Cesium3DTileset({
            url,
            maximumScreenSpaceError: layer.values_.maximumScreenSpaceError,
            showOutline: layer.values_.outline || false,
            dynamicScreenSpaceError: true,
            dynamicScreenSpaceErrorDensity: 0.00278,
            dynamicScreenSpaceErrorFactor: 4.0,
            dynamicScreenSpaceErrorHeightFalloff: 0.25,
            shadows, // SHADOWS PROBLEM Is this working?
            show: layer.values_.visible,
          });
        }
        const tileset = scene.primitives.add(layerTileset);
        layer.CesiumTileset = tileset;

        if (conditions) {
          layerTileset.style = new Cesium.Cesium3DTileStyle({
            color: {
              conditions,
            },
            show,
          });
        }
      }
    }
  };

  // Origo style on picked feature
  const pickedFeatureStyle = () => {
    if (Cesium.PostProcessStageLibrary.isSilhouetteSupported(scene)) {
      silhouetteBlue =
        Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
      silhouetteBlue.uniforms.color = Cesium.Color.ROYALBLUE;
      silhouetteBlue.uniforms.length = 0.1;
      silhouetteBlue.selected = [];

      scene.postProcessStages.add(
        Cesium.PostProcessStageLibrary.createSilhouetteStage([silhouetteBlue])
      );
    }
  };
  // Use featureInfo "overlay" for 3D-tiles
  const get3DFeatureInfo = () => {
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    const obj = {};
    let title;
    let coordinate;

    handler.setInputAction((click) => {
      const feature = scene.pick(click.position);
      const cartesian = scene.pickPosition(click.position);

      if (silhouetteBlue.selected[0] === feature) {
        return;
      } else {
        silhouetteBlue.selected = [feature];
      }

      if (
        Cesium.defined(feature) &&
        feature instanceof Cesium.Cesium3DTileFeature
      ) {
        const layerName = feature.primitive.instanceFeatureIdLabel;

        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const lon = Cesium.Math.toDegrees(Number(cartographic.longitude));
        const lat = Cesium.Math.toDegrees(Number(cartographic.latitude));

        coordinate = [lon, lat];

        if (viewer.getProjectionCode() === "EPSG:3857") {
          coordinate = proj4("EPSG:4326", "EPSG:3857", [lon, lat]);
        }

        const propertyIds = feature.getPropertyIds();
        const contentItems = [];

        propertyIds.forEach((propertyId) => {
          const propId = feature.getProperty(propertyId);
          title = feature.getProperty("name");
          if (title === undefined) {
            title = `Byggnadsid: ${feature.getProperty("elementId")}`;
          }
          if (propId !== undefined) {
            const content = `<ul><li><b>${propertyId}:</b> ${feature.getProperty(
              propertyId
            )}</li>`;
            contentItems.push(content);
          }
        });
        obj.title = `${title}`;
        obj.layerName = layerName;
        obj.content = `${contentItems.join(" ")}</ul>`;
        //skapar en ny olFeature här baserat på 2D-koordinaterna att skicka in till featureInfo
        //pga doRender() vill ha en sån. Utan Feature renderas popup på fel ställe,
        //även om man skickar med koordinater till featureInfo.render()
        obj.feature = new Feature({
          geometry: new Point(coordinate),
          title: `${title}`,
          name: "DummyPoint",
          content: `${contentItems.join(" ")}</ul>`,
        });

        featureInfo.showFeatureInfo(obj);
      } else if (!Cesium.defined(feature)) {
        featureInfo.clear();
      } else if (feature.primitive.olFeature) {
        coordinate = feature.primitive.olFeature.getGeometry().getCoordinates();
        const primitive = feature.primitive.olFeature;
        const layer = feature.primitive.olLayer;

        obj.feature = primitive;
        obj.title = feature.primitive.olLayer.get("title");
        obj.content = getAttributes(primitive, layer);
        obj.layer = layer;

        featureInfo.render([obj], "overlay", coordinate);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  };

  // TODO
  // Function att använda till konfigurering av kameran, speciellt initala ortogonala läget
  const cameraSetter = () => {
    // const mapView = map.getView();
    // const centerCoords = mapView.getCenter().map(coord => parseInt(coord, 10));
    // cesiumScene.camera.setView({
    //   destination: Cesium.Cartesian3.fromDegrees((18.10153, 59.12494, 1000.0), 3, -Cesium.Math.PI_OVER_TWO),
    //   orientation: {
    //     heading: Cesium.Math.toRadians(175.0),
    //     pitch: Cesium.Math.toRadians(-20.0)
    //   }
    // });
  };

  // TODO
  // Put picker in modal, centered on screen
  // Change font-family
  const initFlatpickr = () => {
    flatpickrEl = El({
      tagName: "div",
      cls: "flex column z-index-ontop-top-times20",
    });

    htmlString = flatpickrEl.render();
    el = dom.html(htmlString);
    document.getElementById(target).appendChild(el);

    fp = flatpickr(document.getElementById(flatpickrEl.getId()), {
      enableTime: true,
      defaultDate: new Date(),
      enableSeconds: false,
      disableMobile: true,
    });
  };

  // Configure options for Cesium.Scene
  const sceneSettings = () => {
    settings.enableAtmosphere = settings.enableAtmosphere
      ? (scene.skyAtmosphere.show = true)
      : (scene.skyAtmosphere.show = false);
    settings.enableFog = settings.enableFog
      ? (scene.fog.enabled = true)
      : (scene.fog.enabled = false);
    settings.enableShadows = settings.enableShadows
      ? (scene.shadows = true)
      : (scene.shadows = false);
  };

  // Configure options for Cesium.Globe
  const globeSettings = () => {
    const globe = scene.globe;
    settings.depthTestAgainstTerrain = settings.depthTestAgainstTerrain
      ? (globe.depthTestAgainstTerrain = true)
      : (globe.depthTestAgainstTerrain = false);
    settings.enableGroundAtmosphere = settings.enableGroundAtmosphere
      ? (globe.showGroundAtmosphere = true)
      : (globe.showGroundAtmosphere = false);
    settings.enableLighting = settings.enableLighting
      ? (globe.enableLighting = true)
      : (globe.enableLighting = false);
    if (settings.skyBox) {
      const url = settings.skyBox.url;
      scene.skyBox = new Cesium.SkyBox({
        sources: {
          positiveX: `${url}${settings.skyBox.images.pX}`,
          negativeX: `${url}${settings.skyBox.images.nX}`,
          positiveY: `${url}${settings.skyBox.images.pY}`,
          negativeY: `${url}${settings.skyBox.images.nY}`,
          positiveZ: `${url}${settings.skyBox.images.pZ}`,
          negativeZ: `${url}${settings.skyBox.images.nZ}`,
        },
      });
    }
    settings.skyBox = false;
  };

  // Asynchronously calls to component functions
  const callFuncAsync = async () => {
    await Promise.all([
      terrainProviders(),
      cesium3DtilesProviders(),
      get3DFeatureInfo(),
      showGlobeOption(),
      activeGlobeOnStart(),
      globeSettings(),
      sceneSettings(),
      cesiumCredits(),
      pickedFeatureStyle(),
    ]);
  };

  return Component({
    name: "globe",
    onAdd(evt) {
      viewer = evt.target;
      if (!target) target = `${viewer.getMain().getNavigation().getId()}`;
      oGlobeTarget = viewer.getId();
      map = viewer.getMap();
      featureInfo = viewer.getControlByName("featureInfo");

      // Init flatpickr to set the datetime in oGlobe.time
      initFlatpickr();

      // Init OLCesium
      oGlobe = new OLCesium({
        map,
        target: oGlobeTarget,
        shadows: Cesium.ShadowMode.ENABLED, // SHADOWS PROBLEM Is this working?
        scene3DOnlyy: true,
        terrainExaggeration: 1,
        time: function () {
          return Cesium.JulianDate.fromDate(new Date(fp.element.value));
        },
      });

      // OLCesium needs to be global
      window.oGlobe = oGlobe;
      // Gets Cesium.Scene
      scene = oGlobe.getCesiumScene();
      // setResolutionScale as configuration option
      oGlobe.setResolutionScale(resolutionScale);
      // Asynchronously calls to component functions
      callFuncAsync();

      this.on("render", this.onRender);
      this.addComponents(buttons);
      this.render();
    },
    onInit() {
      globeEl = El({
        tagName: "div",
        cls: "flex column z-index-ontop-top-times20",
      });
      globeButton = Button({
        cls: "o-measure padding-small margin-bottom-smaller icon-smaller round light box-shadow",
        click() {
          // Toggles globe on/off
          // TODO
          // Toggle flatpickrButton aswell
          toggleGlobe();
        },
        icon: "#fa-cube",
        tooltipText: "Globe",
        tooltipPlacement: "east",
      });
      buttons.push(globeButton);

      flatpickrButton = Button({
        cls: "o-measure-length padding-small margin-bottom-smaller icon-smaller round light box-shadow",
        click() {
          // Toggles datetime picker
          fp.open();
        },
        icon: "#ic_clock_24px",
        tooltipText: "Datetime picker",
        tooltipPlacement: "east",
      });
      buttons.push(flatpickrButton);
    },
    render() {
      htmlString = `${globeEl.render()}`;
      el = dom.html(htmlString);
      document.getElementById(target).appendChild(el);
      htmlString = globeButton.render();
      el = dom.html(htmlString);
      document.getElementById(globeEl.getId()).appendChild(el);
      htmlString = flatpickrButton.render();
      el = dom.html(htmlString);
      document.getElementById(globeEl.getId()).appendChild(el);

      this.dispatch("render");
    },
  });
};

export default Globe;
