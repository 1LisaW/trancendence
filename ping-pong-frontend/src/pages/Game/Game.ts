/* eslint-disable @typescript-eslint/no-empty-function */
import { DictionaryType } from "../../lang/dictionary";
import Component from "../../components/Component";

export default class Game extends Component {
	constructor(tag: string, parent: HTMLElement, dictionary: DictionaryType)
	{
		super(tag, parent, dictionary);
		this.container.className = "bg-(--color-paper-base) grow h-auto relative";
		this.init();
	}
	createChildren(): void {
		const div = document.createElement('div');
		div.textContent = "Game";
		this.container.appendChild(div);
	}
	addSubscriptions(): void {

	}
	removeSubscriptions(): void {

	}
	render(): void {

	}
}
