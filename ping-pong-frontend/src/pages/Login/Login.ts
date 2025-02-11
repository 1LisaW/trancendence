/* eslint-disable @typescript-eslint/no-empty-function */
import { DictionaryType } from "../../lang/dictionary";
import { setI18nData } from "../../utils/i18n";
import Component from "../../components/Component";

export default class Login extends Component {
	inputList: { id: string; type: string; required: boolean }[] = [];
	constructor(tag: string, parent: HTMLElement, dictionary: DictionaryType)
	{
		super(tag, parent, dictionary);
		this.container.className ="flex h-full items-center bg-(--color-paper-base)";
		this.init();
	}
	createChildren(): void {
		this.inputList = [
			{id: "email", type: "email", required: true},
			{id: "password", type: "password", required: true}
		]
		const form = document.createElement('form');
		form.className = "rounded-lg min-w-sm lg:w-lg md:w-lg m-auto min-h-1/2 bg-(--color-form-base) p-8 pt-20 shadow-xl";
		this.inputList.forEach((data) => {
			const div = document.createElement('div');
			div.className = "mb-5";
			const label = document.createElement('label');
			label.className = "block mb-2 text-sm font-medium text-(--color-text-form)";
			label.setAttribute("for", data.id);
			setI18nData(label, this.dictionary[this.dictionary.currLang], "login", data.id);
			const input = document.createElement('input');
			input.className = "shadow-xs bg-(--color-paper-base) border border-gray-300 text-(--color-text-form) text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";
			input.setAttribute("type", data.type);
			input.setAttribute("id", data.id);
			if (data.required)
			 input.setAttribute("required", "required");
			div.appendChild(label);
			div.appendChild(input);
			form.append(div);
		})
		const button = document.createElement('button');
		button.className = `text-(--color-text-accent) hover:text-(--color-text-accent2) bg-(--color-accent) hover:bg-(--color-accent2) focus:ring-4 focus:outline-none focus:ring-(--color-form-accent) font-medium rounded-md text-sm px-5 py-2.5 mt-5 text-center`;
		button.setAttribute('type', 'button');
		setI18nData(button, this.dictionary[this.dictionary.currLang], "login", "title");
		form.appendChild(button);
		this.container.appendChild(form);
	}
	addSubscriptions(): void {

	}
	removeSubscriptions(): void {

	}
	render(): void {
		this.parent.append(this.container);
	}
}
