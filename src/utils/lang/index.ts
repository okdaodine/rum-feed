import { i18n } from 'store/i18n';
import * as cn from './cn';
import * as en from './en';
import * as tw from './tw';

export const lang = i18n.createLangLoader({
  cn,
  en,
  tw,
});
