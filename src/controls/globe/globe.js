/* eslint-disable no-template-curly-in-string */
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
import * as Cesium from 'cesium';
import OLCesium from 'olcs/OLCesium';
import proj4 from 'proj4';
import { Component, Button, dom } from '../../ui';
import getAttributes from '../../getattributes';

// ol-cesium depends on a global Cesium
window.Cesium = Cesium;

const Globe = function Globe(options = {}) {
  let map;
  let viewer;
  let oGlobe;
  let globeButton;
  let tileset;
  let terrain;
  let featureInfo;
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
  const showGlobeOption = (scene) => {
    if (!showGlobe) {
      scene.globe.show = false;
    }
  };


  // To use Cesium Ion features token needs to be provided in config option token
  Cesium.Ion.defaultAccessToken = cesiumIontoken;

  // TODO
  // Put the cesium credits in origo credits container in origo style
  const cesiumCredits = () => {
    document.getElementsByClassName('cesium-credit-logoContainer')[0].parentNode.style.display = 'none';
  };

  // Terrain
  const terrainProviders = (scene) => {
    if (cesiumTerrainProvider) {
      terrain = new Cesium.CesiumTerrainProvider({
        requestVertexNormals: true,
        url: cesiumTerrainProvider
      });
      scene.terrainProvider = terrain;
    } else if (cesiumIonassetIdTerrain && cesiumIontoken) {
      terrain = new Cesium.CesiumTerrainProvider({
        requestVertexNormals: true,
        url: Cesium.IonResource.fromAssetId(cesiumIonassetIdTerrain)
      });
      scene.terrainProvider = terrain;
    } else if (cesiumIontoken) {
      // Cesium world terrain is used as default
      terrain = Cesium.createWorldTerrain({
        requestVertexNormals: true
      });
      scene.terrainProvider = terrain;
    }
  };

  // Hide 3D tiles elements by id
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

  // 3D tiles
  const cesium3DtilesProviders = (scene) => {
    if (cesium3dTiles) {
      cesium3dTiles.forEach((tilesAsset) => {
        const url = tilesAsset.url;
        if (typeof url === 'number' && cesiumIontoken) {
          tileset = new Cesium.Cesium3DTileset({
            url: Cesium.IonResource.fromAssetId(url),
            shadows: true,
            maximumScreenSpaceError: tilesAsset.maximumScreenSpaceError || 2,
            showOutline: tilesAsset.outline || false,
            dynamicScreenSpaceError: true,
            dynamicScreenSpaceErrorDensity: 0.00278,
            dynamicScreenSpaceErrorFactor: 4.0,
            dynamicScreenSpaceErrorHeightFalloff: 0.25
          });
        } else {
          tileset = new Cesium.Cesium3DTileset({
            url,
            shadows: true,
            maximumScreenSpaceError: tilesAsset.maximumScreenSpaceError || 2,
            showOutline: tilesAsset.outline || false,
            dynamicScreenSpaceError: true,
            dynamicScreenSpaceErrorDensity: 0.00278,
            dynamicScreenSpaceErrorFactor: 4.0,
            dynamicScreenSpaceErrorHeightFalloff: 0.25
          });
        }
        hide3DtilesById(tilesAsset.hide3DtilesById, tileset);
        scene.primitives.add(tileset);
      });
    }
  };

  // Origo style on picked feature
  const pickedFeatureStyle = (cesiumScene) => {
    const handler = new Cesium.ScreenSpaceEventHandler(cesiumScene.canvas);

    if (Cesium.PostProcessStageLibrary.isSilhouetteSupported(cesiumScene)) {
      const silhouetteBlue = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
      silhouetteBlue.uniforms.color = Cesium.Color.ROYALBLUE;
      silhouetteBlue.uniforms.length = 0.1;
      silhouetteBlue.selected = [];

      cesiumScene.postProcessStages.add(
        Cesium.PostProcessStageLibrary.createSilhouetteStage([
          silhouetteBlue
        ])
      );
      handler.setInputAction((movement) => {
        silhouetteBlue.selected = [];
        const pickedFeature = cesiumScene.pick(movement.position);
        if (silhouetteBlue.selected[0] === pickedFeature) {
          return;
        }
        silhouetteBlue.selected = [pickedFeature];
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    } else {
      console.warn('Silhouette for 3d objects is not supported');
    }
  };

  const get3DFeatureInfo = (cesiumScene) => {
    const handler = new Cesium.ScreenSpaceEventHandler(cesiumScene.canvas);
    const obj = {};
    let title;
    let coordinate;

    handler.setInputAction((click) => {
      const feature = cesiumScene.pick(click.position);
      const cartesian = cesiumScene.pickPosition(click.position);

      if (Cesium.defined(feature) && feature instanceof Cesium.Cesium3DTileFeature) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const lon = Cesium.Math.toDegrees(Number(cartographic.longitude));
        const lat = Cesium.Math.toDegrees(Number(cartographic.latitude));
        // Use alt if in need of height reference
        const alt = cartographic.height;
        if (viewer.getProjectionCode() === 'EPSG:3857') {
          coordinate = proj4('EPSG:4326', 'EPSG:3857', [lon, lat]);
        }

        const propertyNames = feature.getPropertyNames();
        const contentItems = [];

        propertyNames.forEach(propertyName => {
          const propName = feature.getProperty(propertyName);
          title = feature.getProperty('name');
          if (title === undefined) {
            title = `Byggnadsid: ${feature.getProperty('elementId')}`;
          }
          if (propName !== undefined) {
            const content = `<ul><li><b>${propertyName}:</b> ${feature.getProperty(propertyName)}</li>`;
            contentItems.push(content);
          }
        });
        obj.title = `${title}`;
        obj.content = `${contentItems.join(' ')}</ul>`;
        obj.feature = feature;

        featureInfo.render([obj], 'overlay', coordinate, coordinate);
      } else if (!Cesium.defined(feature)) {
        featureInfo.clear();
        console.log('Not a Cesium defined object');
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

  const sceneSettings = (scene) => {
    settings.enableAtmosphere = settings.enableAtmosphere ? scene.skyAtmosphere.show = true : scene.skyAtmosphere.show = false;
    settings.enableFog = settings.enableFog ? scene.fog.enabled = true : scene.fog.enabled = false;
    settings.enableShadows = settings.enableShadows ? scene.shadows = true : scene.shadows = false;
  };
  
  const globeSettings = (scene) => {
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

  return Component({
    name: 'globe',
    onAdd(evt) {
      viewer = evt.target;
      const oGlobeTarget = viewer.getId();
      map = viewer.getMap();
      featureInfo = viewer.getControlByName('featureInfo');
      oGlobe = new OLCesium({ map, target: oGlobeTarget });
      window.oGlobe = oGlobe;
      activeGlobeOnStart();
      const cesiumScene = oGlobe.getCesiumScene();
      oGlobe.setResolutionScale(resolutionScale);
      terrainProviders(cesiumScene);
      cesium3DtilesProviders(cesiumScene, oGlobeTarget);
      get3DFeatureInfo(cesiumScene);
      pickedFeatureStyle(cesiumScene);
      showGlobeOption(cesiumScene);
      globeSettings(cesiumScene);
      sceneSettings(cesiumScene);
      cesiumCredits();

      if (!target) target = `${viewer.getMain().getNavigation().getId()}`;
      this.on('render', this.onRender);
      this.addComponents([globeButton]);
      this.render();
    },
    onInit() {
      globeButton = Button({
        cls: 'o-home-in padding-small icon-smaller round light box-shadow',
        click() {
          toggleGlobe();
        },
        icon: '#fa-cube',
        tooltipText: 'Globe',
        tooltipPlacement: 'east'
      });
    },
    render() {
      const htmlString = globeButton.render();
      const el = dom.html(htmlString);
      document.getElementById(target).appendChild(el);
      this.dispatch('render');
    }
  });
};

export default Globe;
