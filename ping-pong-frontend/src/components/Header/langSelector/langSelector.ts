import { translateAll, setI18nData } from "../../../utils/i18n";
import { getLanguage, LanguageScope, setLanguage } from "../../../utils/tools";
import { dictionary, DictionaryType } from "../../../lang/dictionary";

const handleLangChange = (e: Event) => {
	const lang = (e.target as HTMLSelectElement).value;
	console.log("handleLangChange: ", e.target);
	setLanguage(lang);
	dictionary.currLang = getLanguage();
	translateAll(dictionary, document.body);
}

export const LanguageSelector = (parent: HTMLElement, dictionary: DictionaryType) => {
	const container = document.createElement('div');
	container.className = 'px-4 pt-4';
	const label = document.createElement('label');
	label.setAttribute('for', 'languages');
	label.className = 'themed-label text-(--color-text-form) mb-2 block text-left text-sm font-medium ';
	setI18nData(label, dictionary[dictionary.currLang], 'lang', 'title');
	container.appendChild(label);

	const select = document.createElement('select');
	select.id = 'languages';
	select.className = 'block w-full text-(--color-text-form) bg-(--color-paper-base) cursor-pointer rounded-lg border p-2.5 text-sm outline-transparent';

	LanguageScope.forEach((lang) => {
		const option = document.createElement('option');
		if (dictionary.currLang == lang)
			option.selected = true;
		option.value = lang;
		setI18nData(option, dictionary[dictionary.currLang], 'lang', lang);
		select.appendChild(option);
	});
	select.addEventListener('change', (e) => {handleLangChange(e);});
	container.appendChild(select);

	parent.appendChild(container);
};
