import Component from "../../components/Component";
import { DictionaryType } from "../../lang/dictionary";
import { createSceneWithFireworks } from "../../utils/fireworkUtils";

export default class Lose extends Component {
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

		// Wait for canvas to be in the DOM before creating the scene
		setTimeout(() => {
			createSceneWithFireworks("red");
		}, 100);
	}

	addSubscriptions(): void {
		// No subscriptions for now
	}

	removeSubscriptions(): void {
		// No unsubscriptions for now
	}

	render(): void {
		// No dynamic render needed for now
	}
}
