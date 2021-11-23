import {defineComponent, h, toRef} from "vue";

import User from "./User";

export default defineComponent({
    props: {
        text: { type: String, required: true },
        postAttachment: { type: String, required: true },
        userPicture: { type: String, required: true },
        userName: { type: String, required: true },
        publicationDate: { type: String, required: true }
    },
    setup(props) {
        const text = toRef(props, "text");
        const postAttachment = toRef(props, "postAttachment");
        const userPicture = toRef(props, "userPicture");
        const userName = toRef(props, "userName");
        const publicationDate = toRef(props, "publicationDate");

        return () =>
            h("div", {
                class: "container flex flex-row portrait:flex-col"
            }, [
                h("div", {
                    class: "bloc-left w-1/2 h-full portrait:w-full flex bg-cover bg-no-repeat bg-center flex-row items-center",
                    style: {
                        backgroundImage: "url(" + postAttachment.value + ")"
                    }
                }, [
                    h("div", {
                        class: "h-full w-full bg-opacity-30 bg-black backdrop-filter backdrop-blur-lg bg-contain bg-no-repeat bg-center",
                        style: {
                            backgroundImage: "url(" + postAttachment.value + ")"
                        }
                    })
                ]),
                h("div", {
                    class: "bloc-right w-1/2 h-full portrait:w-full flex items-center justify-center"
                }, [
                    h("div", {
                        class: "w-2/3 h-2/3 text-2xl font-semibold flex justify-center flex-col space-y-10"
                    }, [
                        h("div", {
                            id: "post"
                        }, text.value),
                        h(User, {
                            userPicture: userPicture.value,
                            userName: userName.value,
                            publicationDate: publicationDate.value,
                        })
                    ])
                ])
            ])
    }

})