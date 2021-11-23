import {
    BaseContext,
    AssetDownload,
    IAssetsStorageAbility,
    IGuardsManager,
    ISlideContext,
    IPublicSlide,
    SlideModule
} from "dynamicscreen-sdk-js";

import {computed, reactive, ref} from 'vue';
import i18next from "i18next";

import { h } from "vue"
import Post from "../Components/Post";
import PostAttachments from "../Components/PostAttachments";

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

        const slide = reactive(props.slide) as IPublicSlide
        this.context = reactive(props.slide.context)

        const logo: string = "fab fa-facebook";
        const isPostWithAttachment = computed(() => {
            return !!slide.data.attachmentUrl;
        })
        const postAttachment = isPostWithAttachment.value ? ref(slide.data.attachmentUrl) : null;
        const text = ref(slide.data.text);
        const userPicture = ref(slide.data.user.picture);
        const userName = ref(slide.data.user.name);
        const publicationDate = ref(slide.data.publicationDate);

        this.context.onPrepare(async () => {

        });

        this.context.onReplay(async () => {
        });

        this.context.onPlay(async () => {
            this.context.anime({
                targets: "#post",
                translateX: [-40, 0],
                opacity: [0, 1],
                duration: 600,
                easing: 'easeOutQuad'
            });
            this.context.anime({
                targets: "#user",
                translateX: [-40, 0],
                opacity: [0, 1],
                duration: 600,
                delay: 250,
                easing: 'easeOutQuad'
            });
        });

        // this.context.onPause(async () => {
        //   console.log('Message: onPause')
        // });

        this.context.onEnded(async () => {
        });

        return () =>
            h("div", {
                class: "w-full h-full flex justify-center items-center"
            }, [
                !isPostWithAttachment.value && h(Post, {
                    text: text.value,
                    userPicture: userPicture.value,
                    userName: userName.value,
                    publicationDate: publicationDate.value,
                    class: "w-1/2"
                }),
                isPostWithAttachment.value && h(PostAttachments, {
                    text: text.value,
                    userPicture: userPicture.value,
                    userName: userName.value,
                    publicationDate: publicationDate.value,
                    postAttachment: postAttachment.value,
                    class: "w-full h-full"
                }),
                h("i", {
                    class: "w-16 h-16 absolute top-10 right-10 portrait:bottom-10 portrait:top-auto text-blue-400 " + logo
                })
            ])
    }
}
