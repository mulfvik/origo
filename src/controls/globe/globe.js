import OLCesium from 'olcs/OLCesium';
import { Component, Button, dom } from '../../ui';

const Globe = function Globe(options = {}) {
  let {
    target
  } = options;

  let map;
  let viewer;
  let globeButton;
  let ol3d;

  const toggleGlobe = () => {
    ol3d.setEnabled(!ol3d.getEnabled());
  };

  return Component({
    name: 'globe',
    onAdd(evt) {
      viewer = evt.target;
      map = viewer.getMap();
      ol3d = new OLCesium({ map });
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
