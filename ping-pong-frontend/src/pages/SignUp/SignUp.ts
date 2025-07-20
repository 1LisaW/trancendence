/* eslint-disable @typescript-eslint/no-empty-function */
import { DictionaryType } from "../../lang/dictionary";
import { setI18nData } from "../../utils/i18n";
import Component from "../../components/Component";
import Warning from "../../components/Warning/Warning";
import { GoogleSignIn } from "../../components/GoogleSignIn/GoogleSignIn"; // Simona - Google Sign-in

const AUTH_HOSTNAME = "/gateway/auth";

export default class SignUp extends Component {

	inputList: { id: string; type: string; required: boolean }[] = [];
	form: HTMLFormElement | null = null;
	warnings: Warning[] = [];
	navigate: (route:string)=>void
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
			const name = (this.form?.querySelector('#name') as HTMLInputElement).value;
			const email = (this.form?.querySelector('#email') as HTMLInputElement).value;
			const password = (this.form?.querySelector('#password') as HTMLInputElement).value;
			const repeat_password = (this.form?.querySelector('#repeat-password') as HTMLInputElement).value;
			if (password != repeat_password)
			{
				const container = this.form?.querySelector('#sighup-container-repeat-password') as HTMLElement;
				if (container)
					this.warnings.push(new Warning(container, this.dictionary[this.dictionary.currLang], 'password-not-match'));
			}
			else
			{
				await fetch(`${AUTH_HOSTNAME}/signup`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ name, email, password }),
				}).then((res) => res.json()
				).then((res => {
					switch (res.status) {
						case 201:
							//TODO: ADD LOGIN
							this.navigate('/');
							break;
						case 400:
							if (res.err.err_code == "name-not-unique")
							{
								const container = this.form?.querySelector('#sighup-container-name') as HTMLElement;
								if (container)
									this.warnings.push(new Warning(container, this.dictionary[this.dictionary.currLang], 'name-not-unique'));
								const span = container.querySelector('span');
								if (span)
									span.innerText = span.innerText + `(${res.err.message})`
							}
							else if (res.err.err_code == "already-registered")
							{
								const container = this.form?.querySelector('#sighup-container-email') as HTMLElement;
								if (container)
									this.warnings.push(new Warning(container, this.dictionary[this.dictionary.currLang], 'already-registered'));

							}
							break;
						default:
							break;
					}
					console.log(res)
				}));
			}
			console.log(email);
		} catch {
		//   setMessage('Login failed. Check your credentials.');
		}
	};
	createChildren(): void {

		this.inputList = [
			{id: "name", type: "name", required: true},
			{id: "email", type: "email", required: true},
			{id: "password", type: "password", required: true},
			{id: "repeat-password", type: "password", required: true}
		]

		const form = document.createElement('form');
		form.className = "rounded-lg min-w-sm lg:w-lg md:w-lg m-auto min-h-1/2 bg-(--color-form-base) p-8 pt-20 shadow-xl";

		this.inputList.forEach((data) => {
			const div = document.createElement('div');
			div.setAttribute("id", `sighup-container-${data.id}`);
			div.className = "mb-5";
			const label = document.createElement('label');
			label.className = "block mb-2 text-sm font-medium text-(--color-text-form)";
			label.setAttribute("for", data.id);
			setI18nData(label, this.dictionary[this.dictionary.currLang], "register", data.id);
			const input = document.createElement('input');
			input.className = "shadow-xs bg-(--color-paper-base) border border-gray-300 text-(--color-text-form) text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light";
			input.setAttribute("type", data.type);
			input.setAttribute("id", data.id);
			if (data.required)
				input.setAttribute("required", "required");
			div.appendChild(label);
			div.appendChild(input);
			form.appendChild(div);
		})

		// Regular submit button
		const button = document.createElement('button');
		button.className = `text-(--color-text-accent) hover:text-(--color-text-accent2) bg-(--color-accent) hover:bg-(--color-accent2) focus:ring-4 focus:outline-none focus:ring-(--color-form-accent) font-medium rounded-md text-sm px-5 py-2.5 w-full`;
		button.setAttribute('type', 'submit');
		setI18nData(button, this.dictionary[this.dictionary.currLang], "register", "title");
		form.appendChild(button);

		// Simona - Separator
		const separator = document.createElement('div');
		separator.className = "flex items-center my-4";
		separator.innerHTML = `
			<div class="flex-1 border-t border-gray-300"></div>
			<span class="px-3 text-sm text-gray-500">or</span>
			<div class="flex-1 border-t border-gray-300"></div>
		`;
		form.appendChild(separator);

		// Simona - Google Sign-in button container
		const googleButtonContainer = document.createElement('div');
		googleButtonContainer.className = "w-full flex justify-center";
		googleButtonContainer.id = "google-signin-button-signup";
		form.appendChild(googleButtonContainer);

		this.container.appendChild(form);
		this.form = form;
	}

	addSubscriptions(): void {
		this.form?.addEventListener('submit', this.handleSubmit);

		// this.form?.addEventListener('click', () =>console.log("click"));
        // console.log("addEventListener to form on submit") // Simona - Commented out

		// Simona - Initialize Google Sign-in
		this.googleSignIn = new GoogleSignIn(
			(_token: string) => {
				// Success callback - same as normal signup
				this.navigate('/');
			},
			(_error: string) => {
				// Error callback
				const container = this.form?.querySelector('#signup-container-email') as HTMLElement;
				if (container)
					this.warnings.push(new Warning(container, this.dictionary[this.dictionary.currLang], 'google-auth-failed'));
			},
			"google-signin-button-signup" // pass the correct ID
		);
	}

	removeSubscriptions(): void {
		this.form?.removeEventListener('submit', this.handleSubmit); // Simona - Added to remove submit event listener from form
	}

	render(): void {
		this.parent.append(this.container); // Simona - Added to render the container
	}
}
