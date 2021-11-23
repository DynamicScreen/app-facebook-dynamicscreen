import {defineComponent, h, ref, toRef} from "vue";

export default defineComponent({
    props: {
        userPicture: { type: String, required: true },
        userName: { type: String, required: true },
        publicationDate: { type: String, required: true }
    },
    setup(props) {
        const userPicture = toRef(props, "userPicture");
        const userName = toRef(props, "userName");
        const publicationDate = toRef(props, "publicationDate");

        return () =>
            h("div", {
                class: "w-full flex items-center space-x-5",
                id: "user"
            }, [
                h("div", {
                    class: "rounded-full w-16 h-16 bg-contain",
                    style: {
                        backgroundImage: "url(" + userPicture.value + ")"
                    }
                }),
                h("div", {
                    class: "flex-col"
                }, [
                    h("div", {
                        class: "font-semibold text-xl"
                    }, userName.value),
                    h("div", {
                        class: "text-gray-500 text-base font-light"
                    }, publicationDate.value)
                ])
            ])
    }

})