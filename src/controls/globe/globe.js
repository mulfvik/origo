/* eslint-disable no-template-curly-in-string */
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
import OLCesium from 'olcs/OLCesium';
import * as Cesium from 'cesium';
import { Component, Button, dom } from '../../ui';
import proj4 from 'proj4';
import getAttributes from '../../getattributes';

const Globe = function Globe(options = {}) {
  // ol-cesium depends on a global Cesium
  window.Cesium = Cesium;

  let {
    target
  } = options;

  const {
    resolutionScale = 1,
    cesium3dTiles,
    cesiumTerrainProvider,
    cesiumIontoken,
    cesiumIonassetIdTerrain
  } = options;

  let map;
  let viewer;
  let ol3d;
  let ol3dTarget;
  let cesiumScene;
  let cesiumCanvas;
  let globeButton;
  let tileset;
  let terrain;
  let featureInfo;

  // Toggles between 2D and 3D
  const toggleGlobe = () => {
    ol3d.setEnabled(!ol3d.getEnabled());
  };

  // Find away to check if globe is active from this component.
  const isActive = () => {
    if (ol3d.getEnabled()) {
      console.log('Globe active');
    }
    console.log('Globe not active');
  };

  // To use Cesium Ion features token needs to be provided in config option token
  Cesium.Ion.defaultAccessToken = cesiumIontoken;

  // TODO
  // Put the cesium credits in origo credits container in origo style
  const cesiumCredits = () => {
    document.getElementsByClassName('cesium-credit-logoContainer')[0].parentNode.style.display = 'none';
  };

  // Suspend the camera to go below terrain, that is when the terrain is rendered
  const noCameraBelowTerrain = (scene) => {
    scene.camera.changed.addEventListener(() => {
      if (scene.camera._suspendTerrainAdjustment && scene.mode === Cesium.SceneMode.SCENE3D) {
        scene.camera._suspendTerrainAdjustment = false;
        scene.camera._adjustHeightForTerrain();
      }
    });
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
        if (typeof tilesAsset.url === 'number' && cesiumIontoken) {
          tileset = new Cesium.Cesium3DTileset({
            url: Cesium.IonResource.fromAssetId(url)
          });
        } else {
          tileset = new Cesium.Cesium3DTileset({
            url,
            maximumScreenSpaceError: 2
          });
        }
        hide3DtilesById(tilesAsset.hide3DtilesById, tileset);
        scene.primitives.add(tileset);
      });
    }
  };

  // Set Origo style on picked feature
  const pickedFeatureStyle = (cesiumScene) => {
    const handler = new Cesium.ScreenSpaceEventHandler(cesiumScene.canvas);

    if (Cesium.PostProcessStageLibrary.isSilhouetteSupported(cesiumScene)) {
      let silhouetteBlue = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
      silhouetteBlue.uniforms.color = Cesium.Color.ROYALBLUE;
      silhouetteBlue.uniforms.length = 0.01;
      silhouetteBlue.selected = [];

      cesiumScene.postProcessStages.add(
        Cesium.PostProcessStageLibrary.createSilhouetteStage([
          silhouetteBlue
        ])
      );
      handler.setInputAction(function onLeftClick(movement) {
        silhouetteBlue.selected = [];
        const pickedFeature = cesiumScene.pick(movement.position);
        if (silhouetteBlue.selected[0] === pickedFeature) {
          return;
        }
        silhouetteBlue.selected = [pickedFeature];
      },
        Cesium.ScreenSpaceEventType.LEFT_CLICK);
    } else {
      console.warn('Silhouette for 3d objects is not supported');
    }
  };

  const get3DFeatureInfo = (cesiumScene) => {
    const handler = new Cesium.ScreenSpaceEventHandler(cesiumScene.canvas);
    let obj = {};
    let title;

    handler.setInputAction((click) => {
      const feature = cesiumScene.pick(click.position);
      const cartesian = cesiumScene.pickPosition(click.position);

      if (Cesium.defined(feature) && feature instanceof Cesium.Cesium3DTileFeature) {
        const cartographic = Cesium.Cartographic.fromCartesian(
          cartesian
        );
        const lon = Cesium.Math.toDegrees(
          Number(cartographic.longitude)
        );
        const lat = Cesium.Math.toDegrees(
          Number(cartographic.latitude)
        );
        const alt = cartographic.height;
        // TODO Get the projection from map/layer config instead if map is on 4326
        const epsg3857 = proj4('EPSG:4326', 'EPSG:3857', [lon, lat]);

        const propertyNames = feature.getPropertyNames();
        const contentItems = [];

        for (const propertyName in propertyNames) {
          const propName = propertyNames[propertyName];
          const props = feature.getProperty(propName);
          title = feature.getProperty("elementId");
          if (props != undefined) {
            const content = `<ul><li><b>${propName}:</b> ${feature.getProperty(propName)}</li>`;
            contentItems.push(content);
          }
        }
        obj.title = `Byggnadsid: ${title}`;
        obj.content = contentItems.join(' ') + '</ul>';
        obj.feature = feature;

        featureInfo.render([obj], 'overlay', epsg3857, epsg3857);
      } else if (!Cesium.defined(feature)) {
        featureInfo.clear();
        console.log('Not a Cesium defined object');
      } else if (feature.primitive.olFeature) {
        const coordinate = feature.primitive.olFeature.getGeometry().getCoordinates();
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

  const get3DtilesIdHelper = () => {
    // TODO Draw polygon and get objects [id] for hideObjects function
  };

  return Component({
    name: 'globe',
    onAdd(evt) {
      viewer = evt.target;
      ol3dTarget = viewer.getId();
      map = viewer.getMap();
      featureInfo = viewer.getControlByName('featureInfo');
      ol3d = new OLCesium({ map, target: ol3dTarget });
      cesiumScene = ol3d.getCesiumScene();
      ol3d.setResolutionScale(resolutionScale);
      noCameraBelowTerrain(cesiumScene);
      terrainProviders(cesiumScene);
      cesium3DtilesProviders(cesiumScene);
      get3DFeatureInfo(cesiumScene);
      pickedFeatureStyle(cesiumScene);
      cesiumCredits();
      // // Init Cesium viewer
      // var cesiumViewer = new Cesium.Viewer(ol3dTarget, cesiumViewerOptions);
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
