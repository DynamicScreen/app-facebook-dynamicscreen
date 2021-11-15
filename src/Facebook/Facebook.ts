import {
    BaseContext,
    AssetDownload,
    IAssetsStorageAbility,
    IGuardsManager,
    ISlideContext,
    IPublicSlide,
    SlideModule
} from "dynamicscreen-sdk-js";

import {computed, onMounted, VNode} from 'vue';
import i18next from "i18next";

const en = require("../../languages/en.json");
const fr = require("../../languages/fr.json");

export default class FacebookSlideModule extends SlideModule {
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

        let refreshTimeInterval: number | undefined;

        const saint = ref(slide.data.saint);
        const picture = ref(slide.data.random_photo);
        const author = ref(slide.data.author);

        const now = ref(new Date());
        const hours = computed(() => {
            return now.value.getHours();
        })
        const minutes = computed(() => {
            return now.value.getMinutes();
        })

        this.context.onPrepare(async () => {

        });

        this.context.onReplay(async () => {
        });

        this.context.onPlay(async () => {
            refreshTimeInterval = window.setInterval(() => {
                now.value = new Date();
            }, 1000 * 60);
        });

        // this.context.onPause(async () => {
        //   console.log('Message: onPause')
        // });

        this.context.onEnded(async () => {
            if (refreshTimeInterval) { clearInterval(refreshTimeInterval) }
        });

        return () =>
            h("div", {
                class: "flex w-full h-full bg-no-repeat bg-cover",
                style: { backgroundImage: `url(${picture.value})`}
            }, [
                h("div", {
                    class: "flex w-full justify-end"
                }, [
                    h("div", {
                        class: "flex h-full flex-col space-y-5 w-3/12 bg-opacity-40 bg-black justify-center items-center text-white backdrop-filter backdrop-blur-md"
                    }, [
                        h(Clock, {
                            hours: hours.value,
                            minutes: minutes.value
                        }),
                        h("div", {
                            class: "text-8xl font-medium"
                        }, "15:40"),
                        h("div", {
                            class: "text-4xl"
                        }, "Wednesday 13 October"),
                        h("div", {
                            class: "absolute bottom-5 text-center text-lg"
                        }, `Pictur by : ${author.value}`)
                    ])
                ])
            ])
    }
}
