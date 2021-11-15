import {
  BaseContext,
  AssetDownload,
  IAssetsStorageAbility,
  IGuardsManager,
  ISlideContext,
  IPublicSlide,
  SlideModule,
  SlideUpdateFunctions
} from "dynamicscreen-sdk-js";

import i18next from "i18next";

const en = require("../../languages/en.json");
const fr = require("../../languages/fr.json");

export default class FacebookOptionsModule extends SlideModule {
    constructor(context: ISlideContext) {
        super(context);
    }

    trans(key: string) {
        return i18next.t(key);
    };

    async onReady() {
        return true;
    };

    onMounted() {
        console.log('onMounted')
    }

    //@ts-ignore
    onErrorTracked(err: Error, instance: Component, info: string) {
    }

    //@ts-ignore
    onRenderTriggered(e) {
    }

    //@ts-ignore
    onRenderTracked(e) {
    }

    onUpdated() {
    }

    initI18n() {
        i18next.init({
            fallbackLng: 'en',
            lng: 'fr',
            resources: {
                en: { translation: en },
                fr: { translation: fr },
            },
            debug: true,
        }, (err, t) => {
            if (err) return console.log('something went wrong loading translations', err);
        });
    };

    // @ts-ignore
    setup(props, ctx, update: SlideUpdateFunctions, OptionsContext) {
      const { h, ref, reactive } = ctx;

      // const slide = reactive(props.slide) as IPublicSlide;

      // const accountsList = ref(slide.data.accounts);


      const { Field, FieldsRow, Toggle, Select } = OptionsContext.components
      const account = { id: '228', icon: 'fas fa-image', name: 'unplash account test' };
      return () => [
        h(FieldsRow, {}, [
          h(Field, { class: 'flex-1', label: "Compte Unsplash" }, [
            h(Select, {
              options: [account],
              placeholder: "Choisissez un compte",
              ...update.option("__accounts")
            }),
          ]),
          h(Field, { class: 'flex-1', label: "Catégorie" }, [
            h(Select, {
              options: [
                { name: 'nature' },
                { name: 'animals' },
                { name: 'culture'},
              ],
              placeholder: "Choisissez une catégorie",
              keyProp: 'name',
              ...update.option("category") })
          ]),
        ]),
        h(Toggle, { class: 'flex-1', ...update.option("saint") }, "Affiche le saint du jour."),
      ]
    }
}
