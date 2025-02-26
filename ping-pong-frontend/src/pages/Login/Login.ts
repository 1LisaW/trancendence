/* eslint-disable @typescript-eslint/no-empty-function */
import { DictionaryType } from "../../lang/dictionary";
import { setI18nData } from "../../utils/i18n";
import Component from "../../components/Component";
import Warning from "../../components/Warning/Warning";
import { setToken } from "../../utils/auth";
// import { setSessionUserData } from "../../utils/api";

const AUTH_HOSTNAME = "/api/auth";
export default class Login extends Component {
	navigate: (route:string)=>void
	inputList: { id: string; type: string; required: boolean }[] = [];
	form: HTMLFormElement | null = null;
	warnings: Warning[] = [];

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
						//TODO: set token
						const json = await res.json();
						// const sessionData = await setSessionUserData('login');
						// if (sessionData)
						// {
							setToken(json.token);
							this.navigate('/');
						// }
						// else
						// {
						// 	container = this.form?.querySelector('#login-container-email') as HTMLElement;
						// 	if (container)
						// 		this.warnings.push(new Warning(container, this.dictionary[this.dictionary.currLang], 'server-error'));
						// }
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

			// console.log(email);
		//   const  data  = await fetch('auth/signin');
		//   localStorage.setItem('token', data.token); // Store JWT in localStorage
		//   setMessage('Login Successful');
		//   onLogin(); // Call onLogin to inform the App component of the login status
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

		const button = document.createElement('button');
		button.className = `text-(--color-text-accent) hover:text-(--color-text-accent2) bg-(--color-accent) hover:bg-(--color-accent2) focus:ring-4 focus:outline-none focus:ring-(--color-form-accent) font-medium rounded-md text-sm px-5 py-2.5 mt-5 text-center`;
		button.setAttribute('type', 'submit');
		setI18nData(button, this.dictionary[this.dictionary.currLang], "login", "title");

		form.appendChild(button);
		this.container.appendChild(form);

		this.form =form;
	}

	addSubscriptions(): void {
		this.form?.addEventListener('submit', this.handleSubmit);
		// this.form?.addEventListener('click', () =>console.log("click"));
		console.log("Login addEventListener to form on submit")
	}
	removeSubscriptions(): void {
		this.form?.removeEventListener('submit', this.handleSubmit);
		// this.form?.addEventListener('click', () =>console.log("click"));
		console.log("Login removeEventListener to form on submit")
	}
	render(): void {
		this.parent.append(this.container);
	}
}
