import { DictionaryLanguage, DictionaryType, DictionaryGroups } from '../lang/dictionary';

export const setI18nData = (element: HTMLElement, dictionary:DictionaryLanguage, group: DictionaryGroups, key: string) => {

	const dictionaryLanguageGroup = dictionary[group];
	type dictionaryKeyTypes = keyof typeof dictionaryLanguageGroup;
	element.setAttribute('data-i18n-group', group);
	element.setAttribute('data-i18n-key', key);
	let text = '***No data i18n ***';
	if ( key in dictionaryLanguageGroup)
		text = dictionaryLanguageGroup[key as dictionaryKeyTypes] as string;

	element.innerHTML = text;
}

const translate = (element: HTMLElement, dictionary: DictionaryLanguage) => {
	let translation = '***No data i18n ***';
	const group = element.getAttribute("data-i18n-group") as keyof DictionaryLanguage;
	let key = element.getAttribute("data-i18n-key");
	if (group && group in dictionary && key && key in dictionary[group]) {
		const dictionaryLanguageGroup = dictionary[group];
		type dictionaryKeyTypes = keyof typeof dictionaryLanguageGroup;
		key = key as dictionaryKeyTypes;
		translation = dictionaryLanguageGroup[key];
	}
	element.innerText = translation;
}

export const translateAll = (dictionary: DictionaryType, root: HTMLElement) => {
	const currDictionary = dictionary[dictionary.currLang];
	const elements = root.querySelectorAll('[data-i18n-group]');
	elements.forEach((element) => {
		translate(element as HTMLElement, currDictionary);
	});
}
