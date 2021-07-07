import { Component } from '../../ui';
import { TranslationModel } from './model';
import Intl from './intl';

const Translator = function Translator(options = {}) {
  const {
    url = '',
    intl = ''
  } = options;

  // Get the translation json config
  function getTranslation() {
    fetch(options.url)
      .then((res) => res.json())
      .then((translation) => {
        // Bind response to model
        new TranslationModel(translation);
      })
      .catch(() => {
        console.error('Could not load translation json.');
      })
  }
  getTranslation()

  return Component({
    name: 'translator',
    onAdd() {

      // Find out what lang the user wants for the internationalization API 
      const lang = navigator.languages[0].substr(0, 2);
      const opt = options;
      const langOption = opt.intl ? opt.intl : lang;

      const date = Intl.date(langOption, new Date());
      const number = Intl.number(langOption, 123456.789);

      // A dispatch is mandatory
      this.dispatch('render');
    }
  });
};

export default Translator;
