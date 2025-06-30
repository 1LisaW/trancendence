/* eslint-disable @typescript-eslint/no-empty-function */
import { DictionaryType } from "../../lang/dictionary";
import Component from "../Component";

export default class Footer extends Component {
	constructor(tag: string, parent: HTMLElement, dictionary: DictionaryType)
	{
		super(tag, parent, dictionary);
		this.container.className = 'flex items-center justify-between flex-wrap bg-(--color-accent) text-(--color-text-accent) p-6 h-0 lg:h-25';
		this.init();
	}
	createChildren(): void {
		const div = document.createElement('div');
		div.className = 'w-full mx-auto max-w-screen-xl p-4 md:flex md:items-center md:justify-between';
		const span = document.createElement('span');
		span.className = 'text-sm sm:text-center';
		span.textContent = '© 2023 DreamTeam. All Rights Reserved.';
		div.appendChild(span);
		// div.textContent = "Footer";
		this.container.appendChild(div);
	}
	addSubscriptions(): void {}
	removeSubscriptions(): void {}
	render(): void {}
}
