import { setTheme, getTheme } from "../../utils/tools";

const handleThemeChange = (e: Event) => {
	const theme = (e.target as HTMLSelectElement).value;
	setTheme(theme);
	const root = document.getElementById('app');
	if (root) {
		root.className = `${theme} h-screen flex flex-col`;
	}
}

export const ThemeSelector = (parent: HTMLElement) => {
	const container = document.createElement('div');
	container.className = 'px-4 pt-4';
	const label = document.createElement('label');
	label.setAttribute('for', 'themes');
	label.className = 'themed-label text-(--color-text-form) mb-2 block text-left text-sm font-medium ';
	label.textContent = 'Choose a theme:';
	container.appendChild(label);

	const select = document.createElement('select');
	select.id = 'themes';
	select.className = 'block w-full text-(--color-text-form) bg-(--color-paper-base) cursor-pointer rounded-lg border p-2.5 text-sm outline-transparent';
	select.addEventListener('change', (e) => { handleThemeChange(e); });

	const themes = [{'light': 'Default (Light)'}, {'dark': 'dark'}, {'palette1': 'Palette 1'}, {'palette2': 'Palette 2 '}];
	let currTheme: string | null = getTheme();
	if (!currTheme)
		currTheme = 'light';
	themes.forEach((theme) => {
		const option = document.createElement('option');
		if (currTheme in theme)
			option.selected = true;
		option.value = Object.keys(theme)[0];
		option.textContent = Object.values(theme)[0];
		select.appendChild(option);
	});
	container.appendChild(select);

	parent.appendChild(container);
};
