/* eslint-disable @typescript-eslint/no-empty-function */
import { DictionaryType } from "../../lang/dictionary";
import { setI18nData } from "../../utils/i18n";
import Component from "../../components/Component";
import Warning from "../../components/Warning/Warning";
import { setToken } from "../../utils/auth";
import { GoogleSignIn } from "../../components/GoogleSignIn/GoogleSignIn"; // Simona - Google Sign-in

const AUTH_HOSTNAME = "/gateway/auth";
export default class Login extends Component {
	navigate: (route:string)=>void
	inputList: { id: string; type: string; required: boolean }[] = [];
	form: HTMLFormElement | null = null;
	warnings: Warning[] = [];
	googleSignIn: GoogleSignIn | null = null; // Simona - Google Sign-in

	constructor(tag: string, parent: HTMLElement, dictionary: DictionaryType, navigate: (route:string)=>void)
	{
		super(tag, parent, dictionary);
		this.container.className ="flex h-full items-center bg-(--color-paper-base)";
		this.navigate = navigate;
		this.init();
	}
	handleSubmit = async (e: Event) => {
		e.preventDefault(); // Prevents the page from refreshing on form submission
		this.warnings.forEach(warning=> warning.removeFromDom());
		this.warnings = [];
		try {
			const email = (this.form?.querySelector('#email') as HTMLInputElement).value;
			const password = (this.form?.querySelector('#password') as HTMLInputElement).value;

			const res = await fetch(`${AUTH_HOSTNAME}/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			});
			let container;
			console.log("Login: res:", res);
			switch (res.status) {
				case 200:
					{
						const json = await res.json();
						setToken(json.token);
						this.navigate('/');
					}
					break;
				case 401:
					container = this.form?.querySelector('#login-container-email') as HTMLElement;
					if (container)
						this.warnings.push(new Warning(container, this.dictionary[this.dictionary.currLang], 'login-and-password-not-match'));
					break;
				case 500:
					container = this.form?.querySelector('#login-container-email') as HTMLElement;
					if (container)
						this.warnings.push(new Warning(container, this.dictionary[this.dictionary.currLang], 'server-error'));
					break;
				default:
					break;
			}
				console.log(res);
		} catch {
		//   setMessage('Login failed. Check your credentials.');
		}
	};
	createChildren(): void {
		const form = document.createElement('form');
		form.className = "rounded-lg min-w-sm lg:w-lg md:w-lg m-auto min-h-1/2 bg-(--color-form-base) p-8 pt-20 shadow-xl";

		this.inputList = [
			{id: "email", type: "email", required: true},
			{id: "password", type: "password", required: true}
		]
		this.inputList.forEach((data) => {
			const div = document.createElement('div');
			div.setAttribute("id", `login-container-${data.id}`);
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

		// Regular submit button
		const button = document.createElement('button');
		button.className = `text-(--color-text-accent) hover:text-(--color-text-accent2) bg-(--color-accent) hover:bg-(--color-accent2) focus:ring-4 focus:outline-none focus:ring-(--color-form-accent) font-medium rounded-md text-sm px-5 py-2.5 w-full`;
		button.setAttribute('type', 'submit');
		setI18nData(button, this.dictionary[this.dictionary.currLang], "login", "title");
		form.appendChild(button);

		// Separator
		const separator = document.createElement('div');
		separator.className = "flex items-center my-4";
		separator.innerHTML = `
			<div class="flex-1 border-t border-gray-300"></div>
			<span class="px-3 text-sm text-gray-500">or</span>
			<div class="flex-1 border-t border-gray-300"></div>
		`;
		form.appendChild(separator);

		// Google Sign-in button container
		const googleButtonContainer = document.createElement('div');
		googleButtonContainer.className = "w-full flex justify-center";
		googleButtonContainer.id = "google-signin-button";
		form.appendChild(googleButtonContainer);

		this.container.appendChild(form);
		this.form = form;
	}

	addSubscriptions(): void {
		this.form?.addEventListener('submit', this.handleSubmit);

		// Simona - Initialize Google Sign-in
		this.googleSignIn = new GoogleSignIn(
			document.getElementById('google-signin-button')!,
			(_token: string) => {  // Simona -  Added underscore to indicate unused parameter?
				// Success callback - same as normal login
				this.navigate('/');
			},
			(_error: string) => {
				// Error callback
				const container = this.form?.querySelector('#login-container-email') as HTMLElement;
				if (container)
					this.warnings.push(new Warning(container, this.dictionary[this.dictionary.currLang], 'google-auth-failed'));
			}
		);
	}

	removeSubscriptions(): void {
		this.form?.removeEventListener('submit', this.handleSubmit);
		// this.form?.addEventListener('click', () =>console.log("click"));
		//console.log("Login removeEventListener to form on submit") // Simona - Commented out
	}

	render(): void {
		this.parent.append(this.container);
	}
}
