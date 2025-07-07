import Component from "../../components/Component";
import { DictionaryType } from "../../lang/dictionary";
import { createSceneWithFireworks } from "../../utils/fireworkUtils";

export default class Win extends Component {
	constructor(tag: string, parent: HTMLElement, dictionary: DictionaryType) {
		super(tag, parent, dictionary);
		this.container.className = "h-full w-full bg-black";
		this.init();
	}

	createChildren(): void {
		const canvas = document.createElement("canvas");
		canvas.id = "renderCanvas";
		canvas.className = "w-full h-full";
		this.container.appendChild(canvas);

		// Delay to ensure canvas is in the DOM
		setTimeout(() => {
			createSceneWithFireworks("green");
		}, 100);
	}

	addSubscriptions(): void {
		// Optional: add listeners here
	}

	removeSubscriptions(): void {
		// Optional: remove listeners here
	}

	render(): void {
		// Optional: UI updates go here
	}
}
