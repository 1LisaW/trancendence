/* eslint-disable @typescript-eslint/no-empty-function */
import { DictionaryType } from "../../lang/dictionary";
import { setI18nData } from "../../utils/i18n";
import Component from "../../components/Component";
import Warning from "../../components/Warning/Warning";

const AUTH_HOSTNAME = "/api/auth";

export default class SignUp extends Component {

	inputList: { id: string; type: string; required: boolean }[] = [];
	form: HTMLFormElement | null = null;
	warnings: Warning[] = [];
	navigate: (route:string)=>void

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
		console.log("Event catched");
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
		//   const  data  = await fetch('auth/signin');
		//   localStorage.setItem('token', data.token); // Store JWT in localStorage
		//   setMessage('Login Successful');
		//   onLogin(); // Call onLogin to inform the App component of the login status
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
		const button = document.createElement('button');
		button.className = `text-(--color-text-accent) hover:text-(--color-text-accent2) bg-(--color-accent) hover:bg-(--color-accent2) focus:ring-4 focus:outline-none focus:ring-(--color-form-accent) font-medium rounded-md text-sm px-5 py-2.5 mt-5 text-center`;
		button.setAttribute('type', 'submit');
		setI18nData(button, this.dictionary[this.dictionary.currLang], "register", "title");

		const form = document.createElement('form');
		form.className = "rounded-lg min-w-sm lg:w-lg md:w-lg m-auto min-h-1/2 bg-(--color-form-base) p-8 pt-20 shadow-xl";
		// this.form.setAttribute('action', 'submit');
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
		form.appendChild(button);
		this.container.appendChild(form);
		this.form = form;
	}

	addSubscriptions(): void {


		this.form?.addEventListener('submit', this.handleSubmit);
		// this.form?.addEventListener('click', () =>console.log("click"));
		console.log("addEventListener to form on submit")
	}
	removeSubscriptions(): void {

	}
	render(): void {

	}
}
