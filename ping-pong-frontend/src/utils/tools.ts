
export const LanguageScope = ["en", "ger"] as const;
export type LanguagesType = typeof LanguageScope[number];

export const setLanguage = (lang: string) => {
	console.log("setLanguage: ", lang);
	if (LanguageScope.includes(lang as LanguagesType))
	  localStorage.setItem('lang', lang);
}

export const getLanguage = (): LanguagesType => {
	const lang = localStorage.getItem('lang');
	if (LanguageScope.includes(lang as LanguagesType))
		return lang as LanguagesType;
	return "en";
}

export const getTheme = () => {
	return localStorage.getItem('theme');
}

export const setTheme = (theme: string) => {
	if (getTheme() === theme)
		return;
	localStorage.setItem('theme', theme);
}


