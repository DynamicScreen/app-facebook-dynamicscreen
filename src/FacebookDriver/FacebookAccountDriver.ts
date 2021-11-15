import {
  BaseContext,
  AssetDownload,
  IAssetsStorageAbility,
  IGuardsManager,
  ISlideContext,
  IPublicSlide,
  SlideModule,
} from "dynamicscreen-sdk-js";

import {onMounted, VNode} from 'vue';
import i18next from "i18next";
import Clock from "../components/Clock";

const en = require("../../languages/en.json");
const fr = require("../../languages/fr.json");

export default class TodayAuthProviderModule extends SlideModule {
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
  setup(props, ctx) {
    const { h, reactive, ref, Transition } = ctx;

    const slide = reactive(props.slide) as IPublicSlide;
    this.context = reactive(props.slide.context);

    const city = ref(slide.data.city);
    const todaySummary = ref(slide.data.today_summary)
    const forecast = ref(slide.data.forecast)

    this.context.onPrepare(async () => {

    });

    this.context.onReplay(async () => {
    });

    this.context.onPlay(async () => {

    });

    // this.context.onPause(async () => {
    //   console.log('Message: onPause')
    // });

    this.context.onEnded(async () => {
    });

    return () =>
      h("div", {
        class: "flex w-full h-full bg-no-repeat bg-cover",
        style: { backgroundImage: 'url(\'' + "https://images2.alphacoders.com/100/1003880.png" + '\')'}
      }, [
        h("div", {
          class: "flex w-full justify-end"
        }, [
          h("div", {
            class: "flex h-full flex-col space-y-5 w-3/12 bg-opacity-40 bg-black justify-center items-center text-white backdrop-filter backdrop-blur-md"
          }, [
            h(Clock),
            h("div", {
              class: "text-8xl font-medium"
            }, "15:40"),
            h("div", {
              class: "text-4xl"
            }, "Wednesday 13 October"),
            h("div", {
              class: "absolute bottom-5 text-center text-lg"
            }, "Picture : Dragon ball z")
          ])
        ])
      ])
  }
}
