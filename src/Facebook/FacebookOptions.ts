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
          isAccountDataLoaded.value = accountId !== undefined;
          console.log(accountId, 'onchange')
          if (accountId === undefined) {
            pages.value = {};
          }
        }
      }, { fb_extra: 'fb custom data here' })
        .value?.then((data: any) => {
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
