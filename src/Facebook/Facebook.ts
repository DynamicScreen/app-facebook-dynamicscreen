import {
    ISlideContext,
    IPublicSlide,
    SlideModule,
    VueInstance
} from "dynamicscreen-sdk-js";

import Post from "../Components/Post";
import PostAttachments from "../Components/PostAttachments";

export default class FacebookSlideModule extends SlideModule {
    async onReady() {
        return true;
    };

    setup(props: Record<string, any>, vue: VueInstance, context: ISlideContext) {
        const { h, reactive, ref, computed } = vue;

        const slide = reactive(this.context.slide) as IPublicSlide;
        const logo: string = "fab fa-facebook";
        const isPostWithAttachment = computed(() => {
            return !!slide.data.post.media_url;
        })
        const postAttachment = isPostWithAttachment.value ? ref(slide.data.attachmentUrl) : null;
        const text = ref(slide.data.post.message);
        //@ts-ignore
        const userPicture = ref(slide.data.page.picture.data.url);
        //@ts-ignore
        const userName = ref(slide.data.page.username);
        const publicationDate = ref(slide.data.post.created_time);

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
