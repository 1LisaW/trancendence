import en from './en.json';
import ger from './ger.json';
import { getLanguage } from '../utils/tools';


export const dictionary = {
  en,
  ger,
  currLang: getLanguage() || 'en',
};

export type DictionaryType = typeof dictionary;
export type DictionaryLanguage = typeof dictionary.en;
export type DictionaryGroups = keyof typeof dictionary.en;
