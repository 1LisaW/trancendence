/* eslint-disable @typescript-eslint/no-empty-function */
import { DictionaryType } from "../../lang/dictionary";
import { setI18nData } from "../../utils/i18n";
import "./Main.css"
import Component from "../../components/Component";
import { HappyBalls } from "../../components/HappyBalls/HappyBalls";

export default class Main extends Component {
	balls: HappyBalls | null

	constructor(tag: string, parent: HTMLElement, dictionary: DictionaryType)
	{
		super(tag, parent, dictionary);
		this.container.className = "bg-(--color-paper-base) grow h-auto relative z-1";
		this.balls = null
		this.init();
	}
	createChildren(): void {
		this.balls = new HappyBalls({
			color: 'oklch(0.627 0.265 303.9)',
			amount: 2 + Math.round(Math.random() * 4),
		})

		const div = document.createElement('div');
		div.className = "flex items-center align-middle p-20 text-2xl h-full text-center m-auto z-1"
		setI18nData(div, this.dictionary[this.dictionary.currLang], "main", "welcome");
		this.container.appendChild(div);
	}
	addSubscriptions(): void {

	}
	removeSubscriptions(): void {
		this.balls?.destroy()
	}
	render(): void {

	}
}
