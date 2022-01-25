import {
  ISlideOptionsContext,
  VueInstance,
  SlideOptionsModule,
} from "dynamicscreen-sdk-js";

export default class FacebookOptionsModule extends SlideOptionsModule {
    async onReady() {
        return true;
    };

    setup(props: Record<string, any>, vue: VueInstance, context: ISlideOptionsContext) {
      const { h, ref, reactive } = vue;

      const update = this.context.update;
      const { Field, FieldsRow, Select, NumberInput } = this.context.components

      let isAccountDataLoaded = ref(false)
      let pages: any = reactive({});

      this.context.getAccountData?.("facebook-driver", "pages", {
        onChange: (accountId: number | undefined) => {
          if (typeof accountId === "undefined") {
            isAccountDataLoaded.value = false
          }
          console.log('onchange account', accountId)
          if (accountId === undefined) {
            pages.value = [];
          }
        }
      })
        .value?.then((data: any) => {
          console.log(data, data.value)
          pages.value = Object.keys(data).map((key) => {
            return {'key': key, 'name': data[key]};
          });
          isAccountDataLoaded.value = true;
          console.log('account data successfully fetched', pages)
        }).catch((err) => {
          console.log('error while fetching account data: ', err)
          isAccountDataLoaded.value = false;
        });

      return () => [
        h(FieldsRow, {}, [
          h(Field, { class: 'flex-1', label: "Nombre de pages" }, [
            h(NumberInput, { min: 0, max: 100, default: 1, ...update.option("pageCount") })
          ]),
          h(Field, { class: 'flex-1 hidden', label: "Nombre de publications" }, [
            h(NumberInput, { min: 0, max: 100, default: 1, ...update.option("postCount") })
          ])
        ]),
        isAccountDataLoaded.value && h(Field, { class: 'flex-1', label: "Page à afficher" }, () => [
          h(Select, {
            options: pages.value,
            keyProp: 'key',
            valueProp: 'name',
            placeholder: "Choisissez une des pages à afficher",
            ...update.option("pageId") })
        ])
      ]
    }
}
