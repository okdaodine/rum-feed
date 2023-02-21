import { action, observable } from 'mobx';

const STORAGE_KEY = 'I18N_CURRENT_LANG';

const allLang = ['en', 'cn'] as const;

export type AllLanguages = typeof allLang[number];
type LangData<T> = Record<AllLanguages, { content: T }>;

const defaultLang = (process.env.REACT_APP_DEFAULT_LANG || 'en') as AllLanguages;

const state = observable({
  lang: defaultLang,
});

const createLangLoader = <T>(langData: LangData<T>) => {
  const langState = new Proxy({}, {
    get(_target, prop, _receiver) {
      const data = langData[state.lang];
      if (!data) {
        throw new Error(`${state.lang} language resource for this component is not defined.`);
      }
      return data.content[prop as keyof T];
    },
  });

  return langState as T;
};

const switchLang = action((lang: AllLanguages) => {
  state.lang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
});

const init = action(() => {
  let value = (localStorage.getItem(STORAGE_KEY) || defaultLang) as AllLanguages;
  if (!allLang.includes(value)) {
    value = defaultLang;
  }
  state.lang = value;
});

init();

export const i18n = {
  state,
  createLangLoader,
  switchLang,
};


(window as any).i18n = i18n;