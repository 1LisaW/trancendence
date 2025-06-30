/* eslint-disable @typescript-eslint/no-empty-function */
import Component from "../Component";
import { UserSettings } from "./UserSettings/UserSettings";
import { DictionaryType } from "../../lang/dictionary";
import { setI18nData } from "../../utils/i18n";

export class Header extends Component {
	logo: HTMLElement| null = null;
	title: HTMLElement | null = null;
	userSettings: UserSettings | null = null;
	avatarSrc: string;
	constructor(tag:string, parent: HTMLElement, dictionary: DictionaryType, getIsAuth: ()=>boolean, navigate: (route:string)=>void, avatarSrc:string) {
		super(tag, parent, dictionary);
		this.container.className = 'flex items-center justify-between flex-wrap bg-(--color-accent) p-6 h-25 relative';
		this.init();
		this.avatarSrc = avatarSrc;
		this.userSettings = new UserSettings(this.container, dictionary, getIsAuth, navigate, this.avatarSrc);
	}

	createLogo() {
/* 		this.logo = document.createElement('div');
		this.logo.className = 'flex items-center flex-shrink-0 text-white mr-6';
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.classList.add('fill-current', 'h-8', 'w-8', 'mr-2');
		svg.setAttributeNS(null, 'viewBox', '0 0 54 54');
		svg.setAttributeNS(null, 'width', '54');
		svg.setAttributeNS(null, 'height', '54');


		const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttributeNS(null, 'd', 'M13.5 22.1c1.8-7.2 6.3-10.8 13.5-10.8 10.8 0 12.15 8.1 17.55 9.45 3.6.9 6.75-.45 9.45-4.05-1.8 7.2-6.3 10.8-13.5 10.8-10.8 0-12.15-8.1-17.55-9.45-3.6-.9-6.75.45-9.45 4.05zM0 38.3c1.8-7.2 6.3-10.8 13.5-10.8 10.8 0 12.15 8.1 17.55 9.45 3.6.9 6.75-.45 9.45-4.05-1.8 7.2-6.3 10.8-13.5 10.8-10.8 0-12.15-8.1-17.55-9.45-3.6-.9-6.75.45-9.45 4.05z');
		svg.appendChild(path);
		this.logo.appendChild(svg);
		this.container.appendChild(this.logo); */
	}
	createTitle() {
		this.title = document.createElement('span');
		this.title.className = 'font-semibold text-xl text-(--color-text-accent) tracking-tight';
		setI18nData(this.title, this.dictionary[this.dictionary.currLang],"header", "title");
		this.container.appendChild(this.title);
	}
	createChildren(): void {
/* 		this.createLogo(); */
		this.createTitle();
	}
	render() {
		this.parent.appendChild(this.container);
	}
	addSubscriptions(): void {

	}
	removeSubscriptions(): void {
	}

	update(avatarSrc?: string) {
		this.avatarSrc = avatarSrc || '';
		this.userSettings?.update(this.avatarSrc);
	}
}
