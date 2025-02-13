import { DictionaryType } from "../lang/dictionary";
import { translateAll } from "../utils/i18n";

export default abstract class Component {
	container: HTMLElement;
	children: InstanceType<typeof Component>[] = [];
	parent: HTMLElement;
	dictionary: DictionaryType;
	lang: typeof this.dictionary.currLang;

	constructor(tag: string, parent: HTMLElement, dictionary: DictionaryType){
		this.container = document.createElement(tag);
		this.parent = parent;
		this.dictionary = dictionary;
		this.lang = dictionary.currLang;
		// console.log('parent constructor before', this	);
		// this.createChildren();
		// console.log('parent constructor after');
		// this.addSubscriptions();
		// this.render();
		// this.addToDOM(this.parent);
		// this.parent.appendChild(this.container);
	}

	init() {
		this.createChildren();
		this.addSubscriptions();
		this.render();
		this.addToDOM(this.parent);
		this.parent.appendChild(this.container);
		// console.log('init constructor before', this	);
	}

	abstract createChildren(): void;
	abstract addSubscriptions():void;
	abstract removeSubscriptions():void;
	abstract render(): void;
	addToDOM(parent: HTMLElement | null) {
		if (parent)
			this.parent = parent;
		if (this.container.lang != this.dictionary.currLang)
		{
			this.container.lang = this.dictionary.currLang;
			translateAll(this.dictionary, this.container);
		}
		this.addSubscriptions();
		this.children.forEach((child) => child.addSubscriptions());
		this.parent.appendChild(this.container);
	};
	removeFromDOM() {
		this.removeSubscriptions();
		this.children.forEach((child) => child.removeSubscriptions());
		this.parent.removeChild(this.container);
	};
}
