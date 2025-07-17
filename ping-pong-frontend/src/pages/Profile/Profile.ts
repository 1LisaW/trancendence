import Component from "../../components/Component";
import { DictionaryType } from "../../lang/dictionary";
import { getToken } from "../../utils/auth";

const AUTH_HOSTNAME = "/gateway/auth";
const SCORE_HOSTNAME = "/gateway/score";

// Custom ImageEditor class (canvas-based)
class ImageEditor {
	container: HTMLElement;
	uploadForm: HTMLElement;
	image: HTMLImageElement | null = null;
	avatar: HTMLElement;
	buttonWrapper: HTMLElement;
	private popup: HTMLElement | null = null;
	private canvas: HTMLCanvasElement | null = null;
	private ctx: CanvasRenderingContext2D | null = null;
	private cropArea: { x: number; y: number; size: number } = { x: 200, y: 200, size: 200 };
	private isDragging = false;
	private dragStart = { x: 0, y: 0 };

	constructor(parent: HTMLElement, buttonWrapper: HTMLElement, avatar: HTMLElement, popup: HTMLElement) {
		this.container = document.createElement('div');
		this.container.className = 'flex items-center justify-center w-full';
		this.avatar = avatar;
		this.buttonWrapper = buttonWrapper;
		this.popup = popup;

		const label = document.createElement('label');
		label.setAttribute("for", "dropzone-file");
		label.className = "cursor-pointer flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600";
		this.uploadForm = label;
		this.container.append(label);

		const div = document.createElement('div');
		div.className = "flex flex-col items-center justify-center pt-5 pb-6";
		label.appendChild(div);
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttributeNS(null, "class", "w-8 h-8 mb-4 text-gray-500 dark:text-gray-400");
		svg.setAttributeNS(null, "aria-hidden", "true");
		svg.setAttributeNS(null, "fill", "none");
		svg.setAttributeNS(null, "viewBox", "0 0 20 16");
		svg.innerHTML = '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>';
		div.appendChild(svg);
		const infoBlock = document.createElement('p');
		infoBlock.className = "mb-2 text-sm text-gray-500 dark:text-gray-400";
		infoBlock.innerHTML = `<span class="font-semibold">Click to upload</span> or drag and drop`;
		div.appendChild(infoBlock);
		const fileInfo = document.createElement('p');
		fileInfo.className = "text-xs text-gray-500 dark:text-gray-400";
		fileInfo.innerText = 'PNG or JPEG only (MAX. 2MB)'; // Updated text
		div.appendChild(fileInfo);

		const dropzoneFile = document.createElement('input');
		dropzoneFile.setAttribute("id", "dropzone-file");
		dropzoneFile.setAttribute("type", "file");
		dropzoneFile.setAttribute("accept", "image/png,image/jpeg,image/jpg"); // Only PNG and JPEG
		dropzoneFile.className = 'hidden';
		dropzoneFile.addEventListener('change', (event: Event) => this.onImageUpload(event));
		label.appendChild(dropzoneFile);
		parent.append(this.container);
	}

	private createCropper(image: HTMLImageElement) {
		if (this.canvas) this.container.removeChild(this.canvas);

		this.canvas = document.createElement('canvas');
		this.canvas.width = 400;
		this.canvas.height = 400;
		this.canvas.style.border = '2px solid #3b82f6';
		this.canvas.style.borderRadius = '50%';
		this.canvas.style.cursor = 'move';
		this.ctx = this.canvas.getContext('2d');

		const centerX = this.cropArea.x;
		const centerY = this.cropArea.y;
		const radius = this.cropArea.size / 2;

		this.drawImageWithCrop(image, centerX, centerY, radius);

		this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
		this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
		this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
		this.container.appendChild(this.canvas);
	}

	private drawImageWithCrop(image: HTMLImageElement, centerX: number, centerY: number, radius: number) {
		if (!this.ctx) return;
		this.ctx.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
		this.ctx.clip();

		const imageAspect = image.width / image.height;
		const canvasAspect = this.canvas!.width / this.canvas!.height;
		let drawWidth, drawHeight, drawX, drawY;
		if (imageAspect > canvasAspect) {
			drawHeight = this.canvas!.height;
			drawWidth = drawHeight * imageAspect;
			drawX = (this.canvas!.width - drawWidth) / 2;
			drawY = 0;
		} else {
			drawWidth = this.canvas!.width;
			drawHeight = drawWidth / imageAspect;
			drawX = 0;
			drawY = (this.canvas!.height - drawHeight) / 2;
		}
		this.ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
		this.ctx.restore();
		this.cropArea = { x: centerX, y: centerY, size: radius * 2 };
	}

	private onMouseDown(e: MouseEvent) {
		this.isDragging = true;
		const rect = this.canvas!.getBoundingClientRect();
		this.dragStart = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};
	}

	private onMouseMove(e: MouseEvent) {
		if (!this.isDragging || !this.image) return;
		const rect = this.canvas!.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const centerX = this.cropArea.x + (x - this.dragStart.x);
		const centerY = this.cropArea.y + (y - this.dragStart.y);
		const radius = this.cropArea.size / 2;
		const maxX = this.canvas!.width - radius;
		const maxY = this.canvas!.height - radius;
		const minX = radius;
		const minY = radius;
		this.cropArea.x = Math.max(minX, Math.min(maxX, centerX));
		this.cropArea.y = Math.max(minY, Math.min(maxY, centerY));
		this.drawImageWithCrop(this.image, this.cropArea.x, this.cropArea.y, radius);
		this.dragStart = { x, y };
	}

	private onMouseUp() {
		this.isDragging = false;
	}

	getCroppedCanvas(): HTMLCanvasElement {
		if (!this.canvas || !this.ctx) throw new Error('Canvas not initialized');
		const resultCanvas = document.createElement('canvas');
		const resultCtx = resultCanvas.getContext('2d');
		if (!resultCtx) throw new Error('Could not get canvas context');
		const avatarSize = 200;
		resultCanvas.width = avatarSize;
		resultCanvas.height = avatarSize;
		resultCtx.save();
		resultCtx.beginPath();
		resultCtx.arc(avatarSize / 2, avatarSize / 2, avatarSize / 2, 0, 2 * Math.PI);
		resultCtx.clip();
		const radius = this.cropArea.size / 2;
		const sourceX = this.cropArea.x - radius;
		const sourceY = this.cropArea.y - radius;
		const sourceSize = this.cropArea.size;
		resultCtx.drawImage(
			this.canvas,
			sourceX, sourceY, sourceSize, sourceSize,
			0, 0, avatarSize, avatarSize
		);
		resultCtx.restore();
		return resultCanvas;
	}

	sendImageData = async () => {
		try {
			const croppedCanvas = this.getCroppedCanvas();
			const base64 = croppedCanvas.toDataURL('image/jpeg', 0.8);
			const response = await fetch(`${AUTH_HOSTNAME}/profile`, {
				method: "POST",
				headers: {
					"Authorization": getToken(),
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ avatar: base64 }),
			});
			if (response.ok) {
				this.avatar.innerHTML = `<img src="${base64}" class="w-full h-full object-cover rounded-full" alt="User avatar"/>`;
				if (this.popup) {
					this.popup.remove();
					this.popup = null;
				}
				if (typeof (this.avatar as any)['profileInstance'] === 'object') {
					(this.avatar as any)['profileInstance'].fetchUserInfo();
				}
			}
		} catch (error) {
			console.error('Error uploading avatar:', error);
		}
	}

	onImageUpload = (event: Event) => {
		const target = event.target as HTMLInputElement;
		if (!target || !target.files || target.files.length === 0) return;
		const file = target.files[0];
		const reader = new FileReader();
		const img = document.createElement('img');
		this.image = img;
		if (this.container.contains(this.uploadForm)) this.container.removeChild(this.uploadForm);
		reader.onload = (event) => {
			if (event.target && event.target.result) {
				img.onload = () => this.createCropper(img);
				img.src = event.target.result.toString();
			}
		};
		reader.readAsDataURL(file);
		this.buttonWrapper.innerHTML = '';
		const uploadButton = document.createElement('button');
		uploadButton.type = 'button';
		uploadButton.className = 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors';
		uploadButton.innerText = 'Upload';
		uploadButton.addEventListener('click', () => this.sendImageData());
		this.buttonWrapper.appendChild(uploadButton);
		const cancelButton = document.createElement('button');
		cancelButton.type = 'button';
		cancelButton.className = 'bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors';
		cancelButton.innerText = 'Cancel';
		cancelButton.addEventListener('click', () => {
			if (this.popup) {
				this.popup.remove();
				this.popup = null;
			}
		});
		this.buttonWrapper.appendChild(cancelButton);
	}
}


export interface SCORE_ScoreDTO {
	date: number,
	first_user_id: number,
	second_user_id: number,
	first_user_name: string,
	second_user_name: string,
	first_user_score: number,
	second_user_score: number,
	game_mode: string
}

export interface SCORE_UsersScoreDTO {
	scores: SCORE_ScoreDTO[],
	user_id: number
}
export default class Profile extends Component {
	avatar: HTMLElement;
	popup: HTMLElement | null = null;
	statistics: HTMLElement;
	updateAvatarSrc: () => void;
	userInfo: { name: string; email: string; phone: string } = { name: '', email: '', phone: '' };
	private nameEl!: HTMLElement;
	private emailEl!: HTMLElement;
	private phoneEl!: HTMLElement;
	private leftNameEl!: HTMLElement;
	private leftEmailEl!: HTMLElement;
	friendsBlock: HTMLElement;
	loading: boolean = true;
	error: string = '';

	constructor(tag: string, parent: HTMLElement, dictionary: DictionaryType, avatarSrc: string, updateAvatarSrc: () => void) {
		super(tag, parent, dictionary);
		this.container.className = "flex flex-col h-full items-center bg-(--color-paper-base) justify-center";
		this.avatar = document.createElement('div');
		(this.avatar as any)['profileInstance'] = this;
		this.statistics = document.createElement('div');
		this.updateAvatarSrc = updateAvatarSrc;
		this.friendsBlock = document.createElement('div');
		
		// Clear any existing user data to ensure fresh start
		this.userInfo = { name: '', email: '', phone: '' };
		
		this.update(avatarSrc);
		this.init();
	}

	async fetchUserInfo() {
		this.loading = true;
		this.error = '';

		const token = getToken();
		console.log('Token:', token); // Debug line

		if (!token) {
			this.error = 'No authentication token found. Please log in.';
			this.loading = false;
			return;
		}

		try {
			const userRes = await fetch('/gateway/auth/user', {
				headers: { Authorization: token }
			});

			console.log('User response status:', userRes.status); // Debug line

			if (userRes.status === 401) {
				this.error = 'Authentication failed. Please log in again.';
				this.loading = false;
				return;
			}

			const userData = await userRes.json();
			if (userData.user) {
				this.userInfo.name = userData.user.name;
				this.userInfo.email = userData.user.email;
				// Update all name/email elements with fresh data
				this.updateUserDisplayElements();
			} else {
				this.error = userData.error || 'Failed to fetch user info';
			}

			const profileRes = await fetch('/gateway/auth/profile', {
				headers: { Authorization: token }
			});
			const profileData = await profileRes.json();
			if (profileData.profile) {
				this.userInfo.phone = profileData.profile.phone;
				if (this.phoneEl) this.phoneEl.innerText = this.userInfo.phone || 'Not set';
			} else {
				this.error = profileData.error || 'Failed to fetch profile info';
			}
		} catch (e) {
			this.error = 'Failed to fetch user info';
			console.error('Fetch error:', e);
		}
		this.loading = false;
	}

	// New method to update all user display elements
	updateUserDisplayElements() {
		// Update all name elements
		if (this.nameEl) this.nameEl.innerText = this.userInfo.name;
		if (this.leftNameEl) this.leftNameEl.innerText = this.userInfo.name;
		
		// Update all email elements  
		if (this.emailEl) this.emailEl.innerText = this.userInfo.email;
		if (this.leftEmailEl) this.leftEmailEl.innerText = this.userInfo.email;
	}

	// Method to reset profile data when user changes
	resetProfileData() {
		this.userInfo = { name: '', email: '', phone: '' };
		this.loading = true;
		this.error = '';
	}

	openEditPhoneModal() {
		const modal = document.createElement('div');
		modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
		const box = document.createElement('div');
		box.className = 'bg-white p-6 rounded shadow-lg flex flex-col gap-4';
		const label = document.createElement('label');
		label.innerText = 'Edit phone number:';
		const input = document.createElement('input');
		input.type = 'text';
		input.value = this.userInfo.phone;
		input.className = 'border px-2 py-1 rounded';
		const saveBtn = document.createElement('button');
		saveBtn.innerText = 'Save';
		saveBtn.className = 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700';
		saveBtn.onclick = async () => {
			await this.savePhone(input.value);
			modal.remove();
			await this.fetchUserInfo();
		};
		const cancelBtn = document.createElement('button');
		cancelBtn.innerText = 'Cancel';
		cancelBtn.className = 'bg-gray-300 px-4 py-2 rounded hover:bg-gray-400';
		cancelBtn.onclick = () => modal.remove();
		box.append(label, input, saveBtn, cancelBtn);
		modal.appendChild(box);
		document.body.appendChild(modal);
		input.focus();
	}

	async savePhone(phone: string) {
		try {
			await fetch('/gateway/auth/profile', {
				method: 'POST',
				headers: { 'Authorization': getToken(), 'Content-Type': 'application/json' },
				body: JSON.stringify({ phone }),
			});
			this.userInfo.phone = phone;
			this.phoneEl.innerText = this.userInfo.phone || 'Not set';
		} catch (e) {
			alert('Failed to update phone.');
		}
	}

	openDeleteModal() {
		const modal = document.createElement('div');
		modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
		const box = document.createElement('div');
		box.className = 'bg-white p-6 rounded shadow-lg flex flex-col gap-4';
		const text = document.createElement('div');
		text.innerText = 'Are you sure you want to delete your account? This cannot be undone.';
		const confirmBtn = document.createElement('button');
		confirmBtn.innerText = 'Delete';
		confirmBtn.className = 'bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700';
		confirmBtn.onclick = async () => {
			await this.deleteAccount();
			modal.remove();
		};
		const cancelBtn = document.createElement('button');
		cancelBtn.innerText = 'Cancel';
		cancelBtn.className = 'bg-gray-300 px-4 py-2 rounded hover:bg-gray-400';
		cancelBtn.onclick = () => modal.remove();
		box.append(text, confirmBtn, cancelBtn);
		modal.appendChild(box);
		document.body.appendChild(modal);
	}

	async deleteAccount() {
		try {
			await fetch(`${AUTH_HOSTNAME}/profile`, {
				method: 'DELETE',
				headers: { 'Authorization': getToken() },
			});
			// Log out and reload
			localStorage.clear();
			window.location.href = '/';
		} catch (e) {
			alert('Failed to delete account.');
		}
	}

	renderFriends() {
		this.friendsBlock.innerHTML = '';
		const h2 = document.createElement('h2');
		h2.className = 'mb-2 text-xl font-semibold text-gray-900 dark:text-white';
		h2.innerText = 'Friends';
		this.friendsBlock.appendChild(h2);
		// Mocked friends list
		const friends = [
			{ name: 'Alice', status: 'online' },
			{ name: 'Bob', status: 'offline' },
		];
		if (friends.length === 0) {
			const empty = document.createElement('div');
			empty.className = 'text-gray-500';
			empty.innerText = 'No friends yet.';
			this.friendsBlock.appendChild(empty);
			return;
		}
		const ul = document.createElement('ul');
		friends.forEach(f => {
			const li = document.createElement('li');
			li.className = 'flex items-center gap-2 mb-1';
			const statusDot = document.createElement('span');
			statusDot.className = f.status === 'online' ? 'w-2 h-2 bg-green-500 rounded-full inline-block' : 'w-2 h-2 bg-gray-400 rounded-full inline-block';
			li.appendChild(statusDot);
			li.appendChild(document.createTextNode(f.name));
			ul.appendChild(li);
		});
		this.friendsBlock.appendChild(ul);
	}

	createChildren(): void {
		// Main profile card
		const mainCard = document.createElement('div');
		// Add mt-12 for more space from the top, and gap-8 for more space between left and right columns
		mainCard.className = 'w-full max-w-5xl mx-auto bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col md:flex-row gap-8 mt-12';
		mainCard.style.position = 'relative'; // For absolute positioning of delete button

		// --- LEFT COLUMN: Avatar, name ---
		const leftCol = document.createElement('div');
		// Center vertically with the right column content
		leftCol.className = 'flex flex-col items-center justify-center min-w-[120px] self-start'; // Changed from self-center to self-start

		// Avatar (unchanged)
		this.avatar.setAttribute('id', 'user_avatar');
		this.avatar.className = 'relative w-[120px] h-[120px] rounded-full shadow-2xl overflow-hidden border-4 border-gray-700 flex items-center justify-center bg-(--color-form-base)';
		this.avatar.style.position = 'relative';
		this.avatar.onclick = () => this.avatarEditor(this.container);

		if (this.avatar.innerHTML === '' || this.avatar.querySelector('img') === null) {
			this.avatar.innerHTML = '';
			const plus = document.createElement('span');
			plus.className = 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-mono font-light leading-none select-none pointer-events-none tracking-tight flex items-center justify-center';
			plus.style.fontWeight = '300';
			plus.style.fontSize = '3.5rem';
			plus.style.lineHeight = '1';
			plus.innerText = '+';
			this.avatar.appendChild(plus);
		}

		// Name only
		const name = document.createElement('div');
		name.className = 'text-2xl font-bold text-white mt-2 w-full text-center';
		this.leftNameEl = name;
		name.innerText = this.userInfo.name || 'Username';

		leftCol.append(this.avatar, name);

		// --- RIGHT COLUMN: Info & Friends ---
		const rightCol = document.createElement('div');
		// Fill available space, stack vertically
		rightCol.className = 'flex-1 flex flex-col gap-6';

		// --- Info & Friends cards row ---
		const infoFriendsRow = document.createElement('div');
		// Add gap-6 for space between cards
		infoFriendsRow.className = 'flex flex-col md:flex-row gap-6 w-full';

		// --- Personal Info Card (wider) ---
		const infoCard = document.createElement('div');
		// Fill available space, but keep a max width for readability
		infoCard.className = 'bg-gray-700 rounded-xl p-6 flex-1 min-w-[320px] max-w-[600px] w-full flex flex-col';

		const infoTitle = document.createElement('div');
		infoTitle.className = 'font-semibold text-lg text-white mb-4 text-left';
		infoTitle.innerText = 'Personal Information';

		// Use a grid for label/value pairs, all left-aligned
		const infoFields = document.createElement('div');
		infoFields.className = 'w-full grid grid-cols-[110px_1fr] gap-y-3 gap-x-6 text-left';

		const labels = ['Username:', 'Email:', 'Phone:'];
		const values = [
			this.userInfo.name || 'Not set',
			this.userInfo.email || 'Not set',
			this.userInfo.phone || 'Not set'
		];

		labels.forEach((label, i) => {
			const labelDiv = document.createElement('div');
			labelDiv.className = 'font-medium text-left text-gray-200';
			labelDiv.innerText = label;

			const valueDiv = document.createElement('div');
			valueDiv.className = 'text-left text-gray-100 break-words';
			valueDiv.innerText = values[i];

			// Store references for updating later
			if (i === 0) this.nameEl = valueDiv;
			else if (i === 1) this.emailEl = valueDiv;
			else if (i === 2) this.phoneEl = valueDiv;

			infoFields.appendChild(labelDiv);
			infoFields.appendChild(valueDiv);
		});

		// Add Edit Phone button AFTER all the fields (not inside the loop)
		const editPhoneBtn = document.createElement('button');
		editPhoneBtn.className = 'mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1 rounded text-sm';
		editPhoneBtn.innerText = 'Edit phone number';
		editPhoneBtn.onclick = () => this.openEditPhoneModal();
		infoFields.appendChild(document.createElement('div')); // empty cell for alignment
		infoFields.appendChild(editPhoneBtn);

		infoCard.append(infoTitle, infoFields);

		// --- Friends Card (wider) ---
		const friendsCard = document.createElement('div');
		friendsCard.className = 'bg-gray-700 rounded-xl p-6 flex-1 min-w-[220px] max-w-[340px] flex flex-col';

		const friendsTitle = document.createElement('div');
		friendsTitle.className = 'font-semibold text-lg text-white mb-4 text-left';
		friendsTitle.innerText = 'Friends';

		const friendsList = document.createElement('div');
		friendsList.className = 'flex-1 overflow-y-auto max-h-48'; // Scrollable with max height

		// Fetch real friends data
		this.fetchAndRenderFriends(friendsList);

		friendsCard.append(friendsTitle, friendsList);

		infoFriendsRow.append(infoCard, friendsCard);

		rightCol.append(infoFriendsRow);

		// --- Delete Account Button (bottom of rightCol, right-aligned) ---
		const deleteSection = document.createElement('div');
		deleteSection.className = 'flex justify-end mt-2'; // Small margin only

		const deleteBtn = document.createElement('button');
		deleteBtn.className = 'bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg';
		deleteBtn.innerText = 'Delete Account';
		deleteBtn.onclick = () => this.openDeleteModal();

		deleteSection.appendChild(deleteBtn);
		rightCol.appendChild(deleteSection);

		mainCard.append(leftCol, rightCol);

		// Add Delete Account button to bottom right
		// const deleteBtn = document.createElement('button');
		// deleteBtn.className = 'absolute bottom-6 right-8 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg';
		// deleteBtn.innerText = 'Delete Account';
		// deleteBtn.onclick = () => this.openDeleteModal();
		// mainCard.appendChild(deleteBtn);

		this.container.appendChild(mainCard);

		// --- Game Statistics Card with Tabs ---
		const statsCard = document.createElement('div');
		statsCard.className = 'w-full max-w-5xl mx-auto bg-gray-800 rounded-2xl shadow-lg p-8 mt-8';

		const statsTitle = document.createElement('div');
		statsTitle.className = 'text-2xl font-bold text-white mb-6';
		statsTitle.innerText = 'Game Statistics';

		// Create tabs container
		const tabsContainer = document.createElement('div');
		tabsContainer.className = 'border-b border-gray-700 mb-6';

		const tabsList = document.createElement('ul');
		tabsList.className = 'flex flex-wrap -mb-px text-sm font-medium text-center text-gray-400';

		// Tab buttons
		const tabButtons = [
			{ id: 'pvp-pvc', text: 'PVC & PVP', active: true },
			{ id: 'tournaments', text: 'TOURNAMENTS', active: false },
			{ id: 'pvc-charts', text: 'PVC CHARTS', active: false }
		];

		tabButtons.forEach((tab) => {
			const tabItem = document.createElement('li');
			tabItem.className = 'mr-2';

			const tabButton = document.createElement('button');
			tabButton.className = `inline-block p-4 border-b-2 rounded-t-lg ${
				tab.active
					? 'text-blue-500 border-blue-500 bg-gray-700'
					: 'border-transparent hover:text-gray-300 hover:border-gray-300'
			}`;
			tabButton.innerText = tab.text;
			tabButton.onclick = () => this.switchTab(tab.id);

			tabItem.appendChild(tabButton);
			tabsList.appendChild(tabItem);
		});

		tabsContainer.appendChild(tabsList);

		// Tab content container
		const tabContent = document.createElement('div');
		tabContent.className = 'max-h-96 overflow-y-auto'; // Scrollable content
		tabContent.id = 'tab-content';

		statsCard.append(statsTitle, tabsContainer, tabContent);
		this.container.appendChild(statsCard);

		// Initialize first tab
		this.showTabContent('pvp-pvc');

		// Fetch and render data
		this.fetchUserInfo();
		this.createStatistics();
	}

	avatarEditor(parent: HTMLElement) {
		const popup = document.createElement('div');
		popup.className = 'relative z-10';
		this.popup = popup;
		popup.setAttribute("aria-labelledby", "modal-title");
		popup.setAttribute("role", "dialog");
		popup.setAttribute("aria-modal", "true");

		const layer = document.createElement('div');
		layer.className = 'fixed inset-0 bg-gray-500/75 transition-opacity';
		layer.setAttribute("aria-hidden", "true");
		popup.appendChild(layer);

		const editorContainerWrapper = document.createElement('div');
		editorContainerWrapper.className = 'fixed inset-0 z-10 w-screen overflow-y-auto';
		popup.appendChild(editorContainerWrapper);

		const editorContainer = document.createElement('div');
		editorContainer.className = 'flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0';
		editorContainerWrapper.appendChild(editorContainer);
		const editorBlock = document.createElement('div');
		editorBlock.className = 'relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg';

		editorContainer.appendChild(editorBlock);
		const editor = document.createElement('div');
		editor.className = 'bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4';
		editorBlock.appendChild(editor);

		const buttonWrapper = document.createElement('div');
		buttonWrapper.className = 'bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6';
		new ImageEditor(editor, buttonWrapper, this.avatar, this.popup);
		editor.appendChild(buttonWrapper);
		const cancelButton = document.createElement('button');
		cancelButton.className = 'ml-3 text-(--color-text-accent) hover:text-(--color-text-accent2) bg-(--color-accent) hover:bg-(--color-accent2) focus:ring-4 focus:outline-none focus:ring-(--color-form-accent) font-medium rounded-md text-sm px-5 py-2.5 mt-5 text-center';
		cancelButton.innerText = 'Cancel';
		cancelButton.addEventListener('click', () => {
			if (this.popup)
				this.popup.classList.toggle('hidden');
		});
		buttonWrapper.appendChild(cancelButton);
		parent.append(popup);

	}
	addSubscriptions(): void {
		console.log("Profile addSubscriptions");
	}
	removeSubscriptions(): void {
		console.log("Profile removeSubscriptions");

	}
	render(): void {
		console.log("Profile render");
	}

	update = (avatar: string) => {
		if (avatar === '') {
			const emptyAvatar = document.createElement('div');
			emptyAvatar.setAttribute('id', 'upload_avatar');
			emptyAvatar.className = 'w-[120px] h-[120px] rounded-full bg-(--color-form-base) text-(--color-paper-base) flex items-center justify-center cursor-pointer relative';
			const plus = document.createElement('span');
			plus.className = 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-bold leading-none select-none';
			plus.innerText = '+';
			emptyAvatar.appendChild(plus);
			this.avatar.innerHTML = '';
			this.avatar.appendChild(emptyAvatar);
		}
		else
			this.avatar.innerHTML = `<img src="${avatar}" class="w-full h-full object-cover rounded-full"/>`;
	}

	updateDynamicData(): void {
		console.log("Profile updateDynamicData");
		
		// Reset profile data to ensure fresh start
		this.resetProfileData();
		
		// Clear and recreate the entire profile content
		this.container.innerHTML = '';
		this.createChildren();
		
		// Refresh statistics
		this.statistics.innerHTML = '';
		this.createStatistics();
		
		// Fetch fresh user data
		this.fetchUserInfo();
	}

	createStatistics() {
		this.statistics.innerHTML = '';
		const h2 = document.createElement('h2');
		h2.className = "mb-4 text-2xl font-semibold text-gray-900 dark:text-white";
		h2.innerText = "Users game statistics:";
		this.statistics.appendChild(h2);
		let hasData = false;
		fetch(`${SCORE_HOSTNAME}/score`, {
			method: "GET",
			headers: {
				"Authorization": getToken(),
			},
		}).then(
			(res) => res.json()
		).then(res => {
			if ('user_id' in res && res.scores && res.scores.length > 0)
			{
				hasData = true;
				const h3 = document.createElement('h3');
				h3.className = "mb-2 text-xl font-semibold text-gray-900 dark:text-white";
				h3.innerText = "PVP with PVC:";
				this.statistics.appendChild(h3);
				const data = res as SCORE_UsersScoreDTO;
				this.createScoreTable(data);
			}
			this.showEmptyStatsIfNeeded(hasData);
		});
		fetch(`${SCORE_HOSTNAME}/tournament/user`, {
			method: "GET",
			headers: {
				"Authorization": getToken(),
			},
		}).then(
			(res) => res.json()
		).then(res => {
			if ('tournaments' in res && res.tournaments.length > 0)
			{
				hasData = true;
				const h4 = document.createElement('h3');
				h4.className = "mb-2 text-xl font-semibold text-gray-900 dark:text-white";
				h4.innerText = "Tournaments:";
				this.statistics.appendChild(h4);
				const data:SCORE_UsersScoreDTO  = {scores: res.tournaments, user_id: res.tournaments[0].user_id};
				this.createScoreTable(data);
			}
			this.showEmptyStatsIfNeeded(hasData);
		});
	}

	showEmptyStatsIfNeeded(hasData: boolean) {
		if (!hasData) {
			const empty = document.createElement('div');
			empty.className = 'text-gray-500 mt-4';
			empty.innerText = 'No games played yet.';
			this.statistics.appendChild(empty);
		}
	}

	createScoreTable(data: {scores: SCORE_ScoreDTO[], user_id:number}){
		if (data.scores.length === 0 || !this.statistics)
			return;
		// const tableWrapper = document.createElement('div');
		// tableWrapper.className = "relative overflow-x-auto shadow-md sm:rounded-lg";

		const table = document.createElement('table');
		table.className = "w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400";

		const thead = document.createElement('thead');
		thead.className = "text-xs text-gray-700 uppercase dark:text-gray-400";
		const tableHeadRow = document.createElement('tr');
		const tableHeaders = ['Opponent', 'Date', 'Score', 'Result'];
		tableHeaders.forEach( (tableHeader, id) => {
			const th = document.createElement('th');
			th.setAttribute('scope', "col");
			th.className = id%2? "px-6 py-3": "px-6 py-3 bg-gray-50 dark:bg-gray-800" ;
			th.innerText = tableHeader;
			tableHeadRow.appendChild(th);
		})
		thead.appendChild(tableHeadRow);
		table.appendChild(thead);

		const tbody = document.createElement('tbody');
		data.scores.forEach((scoreData, id) => {
			const tr = document.createElement('tr');
			tr.className = id%2? "border-b border-gray-200 dark:border-gray-700" : "border-b border-gray-200 dark:border-gray-700";

			const th = document.createElement('th');
			th.setAttribute("scope", "row");
			th.className = "px-6 py-4 font-medium text-gray-900 whitespace-nowrap bg-gray-50 dark:text-white dark:bg-gray-800";
			th.innerText = scoreData.first_user_id == data.user_id ? scoreData.second_user_name : scoreData.first_user_name;
			tr.appendChild(th);

			const dateTd = document.createElement('td');
			dateTd.className = "px-6 py-4";
			dateTd.innerText = new Date(scoreData.date).toDateString();
			tr.appendChild(dateTd);

			const scoreTd = document.createElement('td');
			scoreTd.className = "px-6 py-4 bg-gray-50 dark:bg-gray-800";
			scoreTd.innerText = data.user_id == scoreData.first_user_id ?
				`${scoreData.first_user_score} - ${scoreData.second_user_score}`: `${scoreData.second_user_score} - ${scoreData.first_user_score}`
			tr.appendChild(scoreTd);

			const resultTd = document.createElement('td');
			resultTd.className = "px-6 py-4";
			const isDraw = scoreData.first_user_score == scoreData.second_user_score;
			const isWin = (scoreData.first_user_score > scoreData.second_user_score && scoreData.first_user_id == data.user_id)
				|| (scoreData.first_user_score < scoreData.second_user_score && scoreData.second_user_id == data.user_id);
			if (isWin)
			{
				resultTd.innerText = 'W';
				resultTd.classList.add("bg-green-500");
			}
			else if (isDraw)
			{
				resultTd.innerText = 'D';
				resultTd.classList.add("bg-black-100");
			}
			else
			{
				resultTd.innerText = 'L';
				resultTd.classList.add("bg-red-500");
			}

			tr.appendChild(resultTd);

			tbody.appendChild(tr);
		})
		table.appendChild(tbody);
		this.statistics.appendChild(table);
		// parent.appendChild(this.statistics);

	}

	switchTab(tabId: string) {
		// Fix the selector and type issues
		const tabContent = document.getElementById('tab-content');
		if (!tabContent) return;

		const tabsContainer = tabContent.parentElement;
		if (!tabsContainer) return;

		const tabButtons = tabsContainer.querySelectorAll('button');
		tabButtons.forEach((btn: Element, index: number) => {
			const isActive = index === this.getTabIndex(tabId);
			(btn as HTMLElement).className = `inline-block p-4 border-b-2 rounded-t-lg ${
				isActive
					? 'text-blue-500 border-blue-500 bg-gray-700'
					: 'border-transparent hover:text-gray-300 hover:border-gray-300'
			}`;
		});

		this.showTabContent(tabId);
	}

	getTabIndex(tabId: string): number {
		const tabs = ['pvp-pvc', 'tournaments', 'pvc-charts'];
		return tabs.indexOf(tabId);
	}

	showTabContent(tabId: string) {
		const content = document.getElementById('tab-content');
		if (!content) return;

		content.innerHTML = '';

		switch(tabId) {
			case 'pvp-pvc':
				this.showPVPPVCTab(content);
				break;
			case 'tournaments':
				this.showTournamentsTab(content);
				break;
			case 'pvc-charts':
				this.showPVCChartsTab(content);
				break;
		}
	}

	showPVPPVCTab(container: HTMLElement) {
		const title = document.createElement('h3');
		title.className = 'text-xl font-semibold text-white mb-4';
		title.innerText = 'PVC & PVP Games';
		container.appendChild(title);

		// Create a wrapper for the statistics
		const statsWrapper = document.createElement('div');
		statsWrapper.id = 'pvp-pvc-stats';
		container.appendChild(statsWrapper);

		// Fetch and display PVP/PVC data
		this.createStatisticsForTab(statsWrapper);
	}

	showTournamentsTab(container: HTMLElement) {
		const title = document.createElement('h3');
		title.className = 'text-xl font-semibold text-white mb-4';
		title.innerText = 'Tournament History';
		container.appendChild(title);

		// Fetch tournament data
		this.createTournamentStatistics(container);
	}

	showPVCChartsTab(container: HTMLElement) {
		const title = document.createElement('h3');
		title.className = 'text-xl font-semibold text-white mb-4';
		title.innerText = 'PVC Performance Charts';
		container.appendChild(title);

		// Create a simple chart container
		const chartWrapper = document.createElement('div');
		chartWrapper.className = 'bg-gray-700 rounded-lg p-4 mb-4';

		// Legend
		const legend = document.createElement('div');
		legend.className = 'text-xs text-gray-400 mb-4';
		legend.innerText = 'PVC = Player vs Computer. Bars show games played per day.';
		chartWrapper.appendChild(legend);

		// Fetch data and create simple HTML chart
		fetch(`${SCORE_HOSTNAME}/score`, {
			method: "GET",
			headers: { "Authorization": getToken() },
		}).then(res => res.json()).then(res => {
			if ('scores' in res) {
				const pvcGames = res.scores.filter((g: any) => g.game_mode === 'pvc');
				if (pvcGames.length === 0) {
					const noData = document.createElement('div');
					noData.className = 'text-gray-400 text-center py-8';
					noData.innerText = 'No PVC games played yet.';
					chartWrapper.appendChild(noData);
					container.appendChild(chartWrapper);
					return;
				}
				const dateCounts: Record<string, number> = {};
				pvcGames.forEach((g: any) => {
					const date = new Date(g.date).toLocaleDateString();
					dateCounts[date] = (dateCounts[date] || 0) + 1;
				});
				const maxGames = Math.max(...Object.values(dateCounts));
				Object.entries(dateCounts).forEach(([date, count]) => {
					const row = document.createElement('div');
					row.className = 'flex items-center mb-2';
					const label = document.createElement('span');
					label.className = 'w-24 text-gray-300 text-sm';
					label.innerText = date;
					const bar = document.createElement('div');
					bar.className = 'bg-blue-500 h-6 rounded ml-2';
					bar.style.width = `${(count / maxGames) * 100}%`;
					const countLabel = document.createElement('span');
					countLabel.className = 'ml-2 text-white text-xs';
					countLabel.innerText = count.toString();
					row.append(label, bar, countLabel);
					chartWrapper.appendChild(row);
				});
			} else {
				const errorDiv = document.createElement('div');
				errorDiv.className = 'text-red-400 text-center py-4';
				errorDiv.innerText = 'Failed to load chart data.';
				chartWrapper.appendChild(errorDiv);
			}
			container.appendChild(chartWrapper);
		}).catch(error => {
			console.error('Failed to load chart data:', error);
			const errorDiv = document.createElement('div');
			errorDiv.className = 'text-red-400 text-center py-4';
			errorDiv.innerText = 'Failed to load chart data.';
			chartWrapper.appendChild(errorDiv);
			container.appendChild(chartWrapper);
		});
	}

	async fetchAndRenderFriends(container: HTMLElement) {
		try {
			const response = await fetch('/gateway/auth/friends', {
				headers: { 'Authorization': getToken() }
			});

			if (response.ok) {
				const friends = await response.json();
				this.renderFriendsList(container, friends);
			} else {
				this.renderFriendsList(container, []); // Show empty state
			}
		} catch (error) {
			console.error('Failed to fetch friends:', error);
			this.renderFriendsList(container, []);
		}
	}

	renderFriendsList(container: HTMLElement, friends: any[]) {
		container.innerHTML = '';

		if (friends.length === 0) {
			const empty = document.createElement('div');
			empty.className = 'text-gray-400 text-center py-4';
			empty.innerText = 'No friends yet.';
			container.appendChild(empty);
			return;
		}

		friends.forEach(friend => {
			const row = document.createElement('div');
			row.className = 'flex items-center justify-between mb-2 px-3 py-2 rounded bg-gray-600';

			const nameContainer = document.createElement('div');
			nameContainer.className = 'flex-1 min-w-0'; // For text truncation

			const name = document.createElement('span');
			name.className = 'text-gray-100 truncate block'; // Truncate long names
			name.innerText = friend.name;
			nameContainer.appendChild(name);

			const statusBadge = document.createElement('span');
			statusBadge.className = 'text-xs font-semibold px-2 py-1 rounded ml-2 flex-shrink-0';

			// Default to online if no status provided
			const status = friend.status || 'online';

			if (status === 'online') {
				statusBadge.className += ' bg-green-200 text-green-800';
			} else if (status === 'playing') {
				statusBadge.className += ' bg-blue-200 text-blue-800';
			} else {
				statusBadge.className += ' bg-gray-300 text-gray-700';
			}

			statusBadge.innerText = status;

			row.append(nameContainer, statusBadge);
			container.appendChild(row);
		});
	}

	createTournamentStatistics(container: HTMLElement) {
		const title = document.createElement('h3');
		title.className = 'text-xl font-semibold text-white mb-4';
		title.innerText = 'Tournament Statistics';
		container.appendChild(title);

		// Fetch tournament data and display
		fetch(`${SCORE_HOSTNAME}/tournament/user`, {
			method: "GET",
			headers: { "Authorization": getToken() },
		}).then(res => res.json()).then(data => {
			if (data.tournaments && data.tournaments.length > 0) {
				this.createScoreTable({ scores: data.tournaments, user_id: data.tournaments[0].user_id });
			} else {
				const empty = document.createElement('div');
				empty.className = 'text-gray-400 text-center py-4';
				empty.innerText = 'No tournaments played yet.';
				container.appendChild(empty);
			}
		}).catch(error => {
			console.error('Failed to fetch tournament data:', error);
			const errorDiv = document.createElement('div');
			errorDiv.className = 'text-red-400 text-center py-4';
			errorDiv.innerText = 'Failed to load tournament data.';
			container.appendChild(errorDiv);
		});
	}

	createPVCCharts(container: HTMLElement) {
		const title = document.createElement('h3');
		title.className = 'text-xl font-semibold text-white mb-4';
		title.innerText = 'PVC Performance Charts';
		container.appendChild(title);

		// Create a simple chart placeholder
		const chartContainer = document.createElement('div');
		chartContainer.className = 'bg-gray-700 rounded-lg p-4';

		const chartTitle = document.createElement('h4');
		chartTitle.className = 'text-lg font-medium text-white mb-2';
		chartTitle.innerText = 'PVC Games Performance';
		chartContainer.appendChild(chartTitle);

		// Placeholder for chart (you can implement actual charts later)
		const placeholder = document.createElement('div');
		placeholder.className = 'text-gray-400 text-center py-8';
		placeholder.innerText = 'Charts coming soon...';
		chartContainer.appendChild(placeholder);

		container.appendChild(chartContainer);
	}

	createStatisticsForTab(container: HTMLElement) {
		fetch(`${SCORE_HOSTNAME}/score`, {
			method: "GET",
			headers: { "Authorization": getToken() },
		}).then(res => res.json()).then(res => {
			if ('user_id' in res && res.scores && res.scores.length > 0) {
				const data = res as SCORE_UsersScoreDTO;
				this.createScoreTable(data);
			} else {
				const empty = document.createElement('div');
				empty.className = 'text-gray-400 text-center py-4';
				empty.innerText = 'No PVP/PVC games played yet.';
				container.appendChild(empty);
			}
		}).catch(error => {
			console.error('Failed to fetch PVP/PVC data:', error);
			const errorDiv = document.createElement('div');
			errorDiv.className = 'text-red-400 text-center py-4';
			errorDiv.innerText = 'Failed to load game data.';
			container.appendChild(errorDiv);
		});
	}
}
