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

      const { Field, FieldsRow, Toggle, Select, NumberInput } = OptionsContext.components

      let isAccountDataLoaded = ref(false)
      let pages = reactive({});

      OptionsContext.getAccountData("facebook", "pages", (accountId: number | undefined) => {
        isAccountDataLoaded.value = accountId !== undefined;
        console.log(accountId, 'onchange')
        if (accountId === undefined) {
          pages.value = {};
        }
      }, { extra: 'parameters' })
        .value
        .then((data: any) => {
          isAccountDataLoaded.value = true;
          pages.value = data;
          console.log('account data successfully fetched', pages)
        });

      return () => [
        h(FieldsRow, {}, [
          h(Field, { class: 'flex-1', label: "Nombre de pages" }, [
            h(NumberInput, { min: 0, max: 100, default: 1, ...update.option("pageCount") })
          ]),
          h(Field, { class: 'flex-1', label: "Nombre de publications" }, [
            h(NumberInput, { min: 0, max: 100, default: 1, ...update.option("postCount") })
          ]),
          h(isAccountDataLoaded.value && Field, { class: 'flex-1', label: "Page à afficher" }, [
            h(Select, {
              options: [pages],
              placeholder: "Choisissez une des pages à afficher",
              keyProp: 'name',
              ...update.option("pageId") })
          ])
        ])
      ]
    }
}
