/* eslint-disable @typescript-eslint/no-empty-function */
import { DictionaryType } from "../../lang/dictionary";
import Component from "../../components/Component";
import App from "./App/App";
// import App from "./App/App";

export default class Game extends Component {
	constructor(tag: string, parent: HTMLElement, dictionary: DictionaryType)
	{
		super(tag, parent, dictionary);
		this.container.className = "bg-(--color-paper-base) h-full relative w-screen overflow-hidden";
		this.init();
	}
	createChildren(): void {
		const div = document.createElement('div');
		div.className = "max-w-[1300px] flex flex-col justify-center h-full w-screen m-auto rotate-90 lg:rotate-0";
		// div.textContent = "Game";
		// const canvas = new App();
		const app = new App();
		app.appendTo(div);

		// setTimeout(()=> {
			// div.appendChild(canvas._canvas)
		// }, 1300)
		//div.append(canvas._canvas);
		this.container.appendChild(div);
	}
	addSubscriptions(): void {

	}
	removeSubscriptions(): void {

	}
	render(): void {

	}
}
