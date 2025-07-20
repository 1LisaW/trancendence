/* eslint-disable @typescript-eslint/no-empty-function */
import { DictionaryType } from "../../lang/dictionary";
import { setI18nData } from "../../utils/i18n";
import "./Main.css"
import Component from "../../components/Component";

export default class Main extends Component {
	constructor(tag: string, parent: HTMLElement, dictionary: DictionaryType)
	{
		super(tag, parent, dictionary);
		this.container.className = "bg-(--color-paper-base) grow h-auto relative z-1";
		this.init();
	}
	createChildren(): void {
		const ul = document.createElement('ul');
		ul.className = "main-animation absolute w-full h-full overflow-hidden";
		const li = document.createElement('li');
		li.className = "block absolute rounded-full bg-purple-500 w-10 h-10 z-1";
		const li2 = document.createElement('li');
		li2.className = "block absolute rounded-full bg-purple-500 w-10 h-10 z-1";
		ul.appendChild(li);
		ul.appendChild(li2);
		this.container.appendChild(ul);
		const div = document.createElement('div');
		div.className ="flex items-center align-middle p-20 text-2xl h-full text-center m-auto z-1"
		setI18nData(div, this.dictionary[this.dictionary.currLang], "main", "welcome");
		this.container.appendChild(div);
	}
	addSubscriptions(): void {

	}
	removeSubscriptions(): void {

	}
	render(): void {

	}
}
