/* eslint-disable no-underscore-dangle */
import OLCesium from 'olcs/OLCesium';
import { Component, Button, dom } from '../../ui';

const Globe = function Globe(options = {}) {
  // CI... is short for Cesium Ion...
  let {
    target
  } = options;

  const {
    CIToken,
    CIAssetIdTerrain,
    CIAssetId3DTiles
  } = options;

  let map;
  let viewer;
  let globeButton;
  let ol3d;

  // To use Cesium Ion features token needs to be provided in config option CIToken
  Cesium.Ion.defaultAccessToken = CIToken;

  // Toggles between 2D and 3D with the globeButton
  const toggleGlobe = () => {
    ol3d.setEnabled(!ol3d.getEnabled());
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

  const terrainProviders = (scene) => {
    // If asset id is provided for terrain that terrain is used, else a world terrain is used as default
    if (CIAssetIdTerrain) {
      const CITerrainProvider = new Cesium.CesiumTerrainProvider({
        requestVertexNormals: true,
        url: Cesium.IonResource.fromAssetId(CIAssetIdTerrain)
      });
      scene.terrainProvider = CITerrainProvider;
    } else {
      const cesiumTerrainProvider = Cesium.createWorldTerrain({
        requestVertexNormals: true
      });
      scene.terrainProvider = cesiumTerrainProvider;
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
      // If token is provided there is access to Cesium Ion and assets
      if (CIToken) {
        terrainProviders(scene);
      }
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
