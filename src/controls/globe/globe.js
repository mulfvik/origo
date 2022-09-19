import * as Cesium from 'cesium';
import OLCesium from 'olcs/OLCesium';
import proj4 from 'proj4';
import { Component, Button, dom, Element as El } from '../../ui';
import getAttributes from '../../getattributes';
import flatpickr from "flatpickr";

// ol-cesium depends on a global Cesium
window.Cesium = Cesium;

const Globe = function Globe(options = {}) {

  let {
    target,
    globeOnStart,
    showGlobe = true
  } = options;

  const {
    resolutionScale = window.devicePixelRatio,
    settings = {},
    cesium3dTiles,
    cesiumTerrainProvider,
    cesiumIontoken,
    cesiumIonassetIdTerrain
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
  const buttons = [];

  // Toggles between 2D and 3D
  const toggleGlobe = () => {
    // Check if map projection is EPSG:4326 or EPSG:3857. 
    // If map has other projection, don't activate globe and console error
    if (viewer.getProjectionCode() === 'EPSG:4326' || viewer.getProjectionCode() === 'EPSG:3857') {
      oGlobe.setEnabled(!oGlobe.getEnabled());
    } else {
      console.error('Map projection must be EPSG:4326 or EPSG:3857 to be able to use globe mode.');
    }
  };

  // Init map with globe or not
  const activeGlobeOnStart = () => {
    const activeOnStart = globeOnStart ? toggleGlobe() : oGlobe.setEnabled(false);
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
    document.querySelectorAll('.cesium-credit-logoContainer')[0].parentNode.style.display = 'none';
  };

  // Terrain providers
  const terrainProviders = () => {
    if (cesiumTerrainProvider) {
      terrain = new Cesium.CesiumTerrainProvider({
        requestVertexNormals: true,
        // Add as option for 3D Tiles request
        // requestWaterMask: true,
        url: cesiumTerrainProvider
      });
      scene.terrainProvider = terrain;
    } else if (cesiumIonassetIdTerrain && cesiumIontoken) {
      terrain = new Cesium.CesiumTerrainProvider({
        requestVertexNormals: true,
        // Add as option for 3D Tiles request
        // requestWaterMask: true,
        url: Cesium.IonResource.fromAssetId(cesiumIonassetIdTerrain)
      });
      scene.terrainProvider = terrain;
    } else if (cesiumIontoken) {
      // Cesium world terrain is used as default if token is present
      terrain = Cesium.createWorldTerrain({
        requestVertexNormals: true
      });
      scene.terrainProvider = terrain;
    }
  };

  // Hides 3D tiles elements by id, not in use, using filter instead
  // TODO 
  // Create helper to get array of id's from defined bbox or polygon
  const hide3DtilesById = (ids, tilesets) => {
    const elementid = '${elementId} === ';
    const conditions = [];
    ids.forEach((id) => {
      conditions.push([elementid + id, false]);
    });
    conditions.push([true, true]);
    tilesets.style = new Cesium.Cesium3DTileStyle({
      show: {
        conditions
      }
    });
  };

  // 3D tiles providers
  const cesium3DtilesProviders = () => {
    if (cesium3dTiles) {
      cesium3dTiles.forEach((tilesAsset) => {
        const url = tilesAsset.url;
        let shadows = tilesAsset.shadows;
        let conditions = tilesAsset.style;
        let show = tilesAsset.filter || 'undefined';
        if (typeof url === 'number' && cesiumIontoken) {
          tileset = new Cesium.Cesium3DTileset({
            url: Cesium.IonResource.fromAssetId(url),
            maximumScreenSpaceError: tilesAsset.maximumScreenSpaceError,
            showOutline: tilesAsset.outline || false,
            dynamicScreenSpaceError: true,
            dynamicScreenSpaceErrorDensity: 0.00278,
            dynamicScreenSpaceErrorFactor: 4.0,
            dynamicScreenSpaceErrorHeightFalloff: 0.25,
            shadows // SHADOWS PROBLEM Is this working?
          });
        } else if (tilesAsset.url === 'OSM-Buildings') {
          tileset = new Cesium.createOsmBuildings({
            shadows // SHADOWS PROBLEM Is this working?
          });
        } else {
          tileset = new Cesium.Cesium3DTileset({
            url,
            maximumScreenSpaceError: tilesAsset.maximumScreenSpaceError,
            showOutline: tilesAsset.outline || false,
            dynamicScreenSpaceError: true,
            dynamicScreenSpaceErrorDensity: 0.00278,
            dynamicScreenSpaceErrorFactor: 4.0,
            dynamicScreenSpaceErrorHeightFalloff: 0.25,
            shadows // SHADOWS PROBLEM Is this working?
          });
        }
        // hide3DtilesById(tilesAsset.hide3DtilesById, tileset);
        scene.primitives.add(tileset);
        tileset.style = new Cesium.Cesium3DTileStyle({
          color: {
            conditions
          },
          show
        });
      });
    }
  };

  // Origo style on picked feature
  const pickedFeatureStyle = () => {
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

    if (Cesium.PostProcessStageLibrary.isSilhouetteSupported(scene)) {
      const silhouetteBlue = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
      silhouetteBlue.uniforms.color = Cesium.Color.ROYALBLUE;
      silhouetteBlue.uniforms.length = 0.1;
      silhouetteBlue.selected = [];

      scene.postProcessStages.add(
        Cesium.PostProcessStageLibrary.createSilhouetteStage([
          silhouetteBlue
        ])
      );
      handler.setInputAction((movement) => {
        silhouetteBlue.selected = [];
        const pickedFeature = scene.pick(movement.position);
        if (silhouetteBlue.selected[0] === pickedFeature) {
          return;
        }
        silhouetteBlue.selected = [pickedFeature];
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    } else {
      console.warn('Silhouette for 3d objects is not supported');
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

      if (Cesium.defined(feature) && feature instanceof Cesium.Cesium3DTileFeature) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const lon = Cesium.Math.toDegrees(Number(cartographic.longitude));
        const lat = Cesium.Math.toDegrees(Number(cartographic.latitude));
        // Use alt for height
        // const alt = cartographic.height;
        if (viewer.getProjectionCode() === 'EPSG:3857') {
          coordinate = proj4('EPSG:4326', 'EPSG:3857', [lon, lat]);
        }

        const propertyIds = feature.getPropertyIds();
        const contentItems = [];

        propertyIds.forEach(propertyId => {
          const propId = feature.getProperty(propertyId);
          title = feature.getProperty('name');
          if (title === 'undefined') {
            title = `Byggnadsid: ${feature.getProperty('elementId')}`;
          }
          if (propId !== 'undefined') {
            const content = `<ul><li><b>${propertyId}:</b> ${feature.getProperty(propertyId)}</li>`;
            contentItems.push(content);
          }
        });
        obj.title = `${title}`;
        obj.content = `${contentItems.join(' ')}</ul>`;
        obj.feature = feature;

        featureInfo.render([obj], 'overlay', coordinate, coordinate);
      } else if (!Cesium.defined(feature)) {
        featureInfo.clear();
      } else if (feature.primitive.olFeature) {
        coordinate = feature.primitive.olFeature.getGeometry().getCoordinates();
        const primitive = feature.primitive.olFeature;
        const layer = feature.primitive.olLayer;

        obj.feature = feature;
        obj.title = feature.primitive.olLayer.get('title');
        obj.content = getAttributes(primitive, layer);
        obj.layer = layer;

        featureInfo.render([obj], 'overlay', coordinate);
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
      tagName: 'div',
      cls: 'flex column z-index-ontop-top-times20'
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
    settings.enableAtmosphere = settings.enableAtmosphere ? scene.skyAtmosphere.show = true : scene.skyAtmosphere.show = false;
    settings.enableFog = settings.enableFog ? scene.fog.enabled = true : scene.fog.enabled = false;
    settings.enableShadows = settings.enableShadows ? scene.shadows = true : scene.shadows = false;
  };

  // Configure options for Cesium.Globe
  const globeSettings = () => {
    const globe = scene.globe;
    settings.depthTestAgainstTerrain = settings.depthTestAgainstTerrain ? globe.depthTestAgainstTerrain = true : globe.depthTestAgainstTerrain = false;
    settings.enableGroundAtmosphere = settings.enableGroundAtmosphere ? globe.showGroundAtmosphere = true : globe.showGroundAtmosphere = false;
    settings.enableLighting = settings.enableLighting ? globe.enableLighting = true : globe.enableLighting = false;
    if (settings.skyBox) {
      const url = settings.skyBox.url;
      scene.skyBox = new Cesium.SkyBox({
        sources: {
          positiveX: `${url}${settings.skyBox.images.pX}`,
          negativeX: `${url}${settings.skyBox.images.nX}`,
          positiveY: `${url}${settings.skyBox.images.pY}`,
          negativeY: `${url}${settings.skyBox.images.nY}`,
          positiveZ: `${url}${settings.skyBox.images.pZ}`,
          negativeZ: `${url}${settings.skyBox.images.nZ}`
        }
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
      pickedFeatureStyle(),
      showGlobeOption(),
      activeGlobeOnStart(),
      globeSettings(),
      sceneSettings(),
      cesiumCredits()
    ]);
  };

  return Component({
    name: 'globe',
    onAdd(evt) {
      viewer = evt.target;
      if (!target) target = `${viewer.getMain().getNavigation().getId()}`;
      oGlobeTarget = viewer.getId();
      map = viewer.getMap();
      featureInfo = viewer.getControlByName('featureInfo');

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
        }
      });

      // OLCesium needs to be global
      window.oGlobe = oGlobe;
      // Gets Cesium.Scene 
      scene = oGlobe.getCesiumScene();
      // setResolutionScale as configuration option
      oGlobe.setResolutionScale(resolutionScale);
      // Asynchronously calls to component functions 
      callFuncAsync();

      this.on('render', this.onRender);
      this.addComponents(buttons);
      this.render();
    },
    onInit() {
      globeEl = El({
        tagName: 'div',
        cls: 'flex column z-index-ontop-top-times20'
      });
      globeButton = Button({
        cls: 'o-measure padding-small margin-bottom-smaller icon-smaller round light box-shadow',
        click() {
          // Toggles globe on/off
          // TODO
          // Toggle flatpickrButton aswell
          toggleGlobe();
        },
        icon: '#fa-cube',
        tooltipText: 'Globe',
        tooltipPlacement: 'east'
      });
      buttons.push(globeButton);

      flatpickrButton = Button({
        cls: 'o-measure-length padding-small margin-bottom-smaller icon-smaller round light box-shadow',
        click() {
          // Toggles datetime picker
          fp.open();
        },
        icon: '#ic_clock_24px',
        tooltipText: 'Datetime picker',
        tooltipPlacement: 'east'
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

      this.dispatch('render');
    }
  });
};

export default Globe;
