/* eslint-disable no-template-curly-in-string */
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
    cesium3dTiles,
    cesiumTerrainProvider,
    cesiumIontoken,
    cesiumIonassetIdTerrain
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

  // To use Cesium Ion features token needs to be provided in config option token
  Cesium.Ion.defaultAccessToken = cesiumIontoken;

  // TODO put default cesium credits in origo credits container, origo style
  // Hide default credits
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
  const hideObjects = (ids, tilesets) => {
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
            url
          });
        }
        hideObjects(tilesAsset.hiddenObjectsId, tileset);
        scene.primitives.add(tileset);
      });
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
