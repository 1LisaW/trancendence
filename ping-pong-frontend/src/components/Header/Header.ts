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
	this.container.className = `
	font-cartoon text-3xl tracking-wider text-white drop-shadow-md
	flex items-center justify-between flex-wrap
	p-4 h-20
	bg-white/10 backdrop-blur-md
	shadow-lg border border-white/20
	text-white fixed top-4 left-1/2 transform -translate-x-1/2
	w-[calc(100%-2rem)] max-w-6xl rounded-xl z-10
	`;


	this.container.className += " wood-texture";

/* 		this.container.className = 'flex items-center justify-between flex-wrap bg-(--color-accent) p-6 h-25 relative'; */
		this.init();
		this.avatarSrc = avatarSrc;
		this.userSettings = new UserSettings(this.container, dictionary, getIsAuth, navigate, this.avatarSrc);
	}

	createTitle() {
		this.title = document.createElement('span');
		this.title.className = `
			font-cartoon
			text-3xl
			tracking-wider
			text-white
			drop-shadow-md
			mx-auto
		`;
		setI18nData(this.title, this.dictionary[this.dictionary.currLang], "header", "title");
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
