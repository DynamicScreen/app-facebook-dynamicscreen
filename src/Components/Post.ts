import {defineComponent, h, toRef} from "vue"

import User from "./User"

export default defineComponent({
    props: {
        text:  { type: String, required: true },
        userPicture: { type: String, required: true },
        userName: { type: String, required: true },
        publicationDate: { type: String, required: true }
    },
    setup(props) {
        const text = toRef(props, "text")
        const userPicture = toRef(props, "userPicture");
        const userName = toRef(props, "userName");
        const publicationDate = toRef(props, "publicationDate");

        return () =>
            h("div", {
                class: "container flex flex-col space-y-10"
            }, [
                h("div", {
                    class: "text-3xl font-semibold text-gray-800",
                    id: "post"
                }, text.value),
                h(User, {
                    userPicture: userPicture.value,
                    userName: userName.value,
                    publicationDate: publicationDate.value,
                })
            ])
    }
})