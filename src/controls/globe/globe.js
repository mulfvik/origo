/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
import OLCesium from 'olcs/OLCesium';
import * as Cesium from 'cesium';
import { Component, Button, dom } from '../../ui';

const Globe = function Globe(options = {}) {
  // ol-cesium depends on a global Cesium
  window.Cesium = Cesium;

  let {
    target
  } = options;

  const {
    CIToken,
    CIAssetIdTerrain,
    CIAssetId3DTiles,
    CesiumTerrainProvider,
    Cesium3DTilesUrl
  } = options;

  let map;
  let viewer;
  let ol3d;
  let globeButton;
  let tileset;
  let terrain;

  // Toggles between 2D and 3D
  const toggleGlobe = () => {
    ol3d.setEnabled(!ol3d.getEnabled());
  };

  // To use Cesium Ion features token needs to be provided in config option CIToken
  Cesium.Ion.defaultAccessToken = CIToken;

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
    if (CesiumTerrainProvider) {
      terrain = new Cesium.CesiumTerrainProvider({
        requestVertexNormals: true,
        url: CesiumTerrainProvider
      });
      scene.terrainProvider = terrain;
    } else if (CIAssetIdTerrain && CIToken) {
      terrain = new Cesium.CesiumTerrainProvider({
        requestVertexNormals: true,
        url: Cesium.IonResource.fromAssetId(CIAssetIdTerrain)
      });
      scene.terrainProvider = terrain;
    } else if (CIToken) {
      // Cesium world terrain is used as default
      terrain = Cesium.createWorldTerrain({
        requestVertexNormals: true
      });
      scene.terrainProvider = terrain;
    }
  };

  // 3D-tiles
  const cesium3DtilesProviders = (scene) => {
    if (Cesium3DTilesUrl) {
      tileset = new Cesium.Cesium3DTileset({
        url: Cesium3DTilesUrl
      });
      scene.primitives.add(tileset);
    } else if (CIAssetId3DTiles && CIToken) {
      tileset = new Cesium.Cesium3DTileset({
        url: Cesium.IonResource.fromAssetId(CIAssetId3DTiles)
      });
      scene.primitives.add(tileset);
    } else if (CIToken) {
      // OSM buildings is used as default
      tileset = new Cesium.Cesium3DTileset({
        url: Cesium.IonResource.fromAssetId(96188)
      });
      scene.primitives.add(tileset);
    }
  };

  return Component({
    name: 'globe',
    onAdd(evt) {
      viewer = evt.target;
      map = viewer.getMap();
      ol3d = new OLCesium({ map });
      const scene = ol3d.getCesiumScene();
      
      noCameraBelowTerrain(scene);
      terrainProviders(scene);
      cesium3DtilesProviders(scene);

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
