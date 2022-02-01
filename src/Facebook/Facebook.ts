import {
  ISlideContext,
  IPublicSlide,
  SlideModule,
  VueInstance, IAssetsStorageAbility, IAssetDownload, IVideoPlaybackAbility
} from "dynamicscreen-sdk-js";

import Post from "../Components/Post";
import PostAttachments from "../Components/PostAttachments";

export default class FacebookSlideModule extends SlideModule {
    async onReady() {
      // const guard = this.context.guardManager.add('ready', this.context.slide.id);
      await this.context.assetsStorage().then(async (ability: IAssetsStorageAbility) => {
        //@ts-ignore
        await ability.downloadAndGet(this.context.slide.data.page.picture.data.url, {
          callback: (assetDownload: IAssetDownload) => {
            assetDownload.onProgress.subscribe((progress, ev) => {
              console.log('fb dl asset progress: ', progress)
              ev.unsub();
            });
            assetDownload.onCompleted.subscribe((asset, ev) => {
              console.log('fb dl asset completed')
              ev.unsub();
            });
          }, noRetry: false
        });

        if (!!this.context.slide.data.post.attachments.data[0]?.media?.image?.src) {
          await ability.downloadAndGet(this.context.slide.data.post.attachments.data[0].media.image.src);
        }

      });

      return true;
    };

    setup(props: Record<string, any>, vue: VueInstance, context: ISlideContext) {
        const { h, reactive, ref, computed } = vue;
        const slide = reactive(this.context.slide) as IPublicSlide;

        const logo: string = "fab fa-facebook";
        const isPostWithAttachment = computed(() => {
            return !!slide.data.post.attachments.data[0]?.media?.image?.src;
        })
        const postAttachment = ref(slide.data.post.attachments.data[0].media.image.src);
        const text = ref(slide.data.post.message);
        //@ts-ignore
        const userPicture = ref(slide.data.page.picture.data.url);
        //@ts-ignore
        const userName = ref(slide.data.page.username);
        const publicationDate = ref(slide.data.post.created_time);

        this.context.onPrepare(async () => {
          isPostWithAttachment.value && await this.context.assetsStorage().then(async (ability: IAssetsStorageAbility) => {
            postAttachment.value = await ability.getDisplayableAsset(postAttachment.value).then((asset) => asset.displayableUrl());
          });

          await this.context.assetsStorage().then(async (ability: IAssetsStorageAbility) => {
            userPicture.value = await ability.getDisplayableAsset(userPicture.value).then((asset) => asset.displayableUrl());
          });
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
