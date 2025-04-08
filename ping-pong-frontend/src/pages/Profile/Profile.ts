import Component from "../../components/Component";
import { DictionaryType } from "../../lang/dictionary";
import Cropper from 'cropperjs';
import { getToken } from "../../utils/auth";

const AUTH_HOSTNAME = "/gateway/auth";
const SCORE_HOSTNAME = "/gateway/score";

class ImageEditor {
	container: HTMLElement;
	uploadForm: HTMLElement;
	image: HTMLImageElement | null = null;
	// imgPreview: HTMLImageElement | null = null;
	avatar: HTMLElement;
	buttonWrapper: HTMLElement;

	constructor(parent: HTMLElement, buttonWrapper: HTMLElement, avatar: HTMLElement) {
		this.container = document.createElement('div');
		this.container.className = 'flex items-center justify-center w-full';
		this.avatar = avatar;
		this.buttonWrapper = buttonWrapper;

		const label = document.createElement('label');
		label.setAttribute("for", "dropzone-file");
		label.className = "cursor-pointer flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600";
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
		fileInfo.innerText = 'SVG, PNG, JPG or GIF (MAX. 800x400px)';
		div.appendChild(fileInfo);

		const dropzoneFile = document.createElement('input');
		dropzoneFile.setAttribute("id", "dropzone-file");
		dropzoneFile.setAttribute("type", "file");
		dropzoneFile.className = 'hidden';
		dropzoneFile.addEventListener('change', (event: Event) => this.onImageUpload(event));
		label.appendChild(dropzoneFile);
		parent.append(this.container);
	}

	getRoundedCanvas = (sourceCanvas: HTMLCanvasElement) => {
		if (!sourceCanvas)
			return;
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		const width = sourceCanvas.width;
		const height = sourceCanvas.height;

		canvas.width = width;
		canvas.height = height;
		if (context) {
			context.imageSmoothingEnabled = true;
			context.drawImage(sourceCanvas, 0, 0, width, height);
			context.globalCompositeOperation = 'destination-in';
			context.beginPath();
			context.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI, true);
			context.fill();
		}
		return canvas;
	}

	sendImageData = (cropper: Cropper) => {
		// Upload cropped image to server if the browser supports `HTMLCanvasElement.toBlob`.
		// The default value for the second parameter of `toBlob` is 'image/png', change it if necessary.

		const base64 = cropper.getCroppedCanvas().toDataURL('image/jpeg'); // => {
		// const formData = new FormData();
		// Pass the image file name as the third parameter if necessary.
		// if (!blob)
		// return ;
		// formData.append('croppedImage', blob/*, 'example.png' */);
		// console.log(base64);
		fetch(`${AUTH_HOSTNAME}/profile`, {
			method: "POST",
			headers: {
				"Authorization": getToken(),
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ avatar: base64 }),
		});
		// fetch()
		this.avatar.innerHTML = `<img src="${base64}"/>`;
		// });
	}

	onImageUpload = (event: Event) => {
		this.image = document.createElement('img');
		this.image.setAttribute('id', "imgPreview");
		const target = event.target as HTMLInputElement;
		if (target && target.files && target.files.length) {
			// start file reader
			const reader = new FileReader();
			const img = document.createElement('img');
			this.image = img;
			this.container.removeChild(this.uploadForm);
			const getRoundedCanvas = this.getRoundedCanvas;
			// const imgPreview = this.imgPreview;
			let cropper: Cropper;
			reader.onload = function (event) {
				if (event.target && event.target.result) {
					// create new image
					img.id = 'image';
					img.setAttribute('src', event.target.result.toString());
					img.setAttribute('width', '544');
					img.setAttribute('height', '370');

					// init cropper
					cropper = new Cropper(img, {
						viewMode: 1,
						dragMode: 'move',
						aspectRatio: 1,
						autoCropArea: 0.68,
						minContainerWidth: 544,
						minContainerHeight: 370,
						center: false,
						zoomOnWheel: true,
						zoomOnTouch: false,
						cropBoxMovable: false,
						cropBoxResizable: false,
						guides: false,
						ready: function () {
							// Cropper is ready
						},
						crop: function () {
							// const imgSrc = cropper.getCroppedCanvas({
							// 	width: 170,
							// 	height: 170// input value
							// }).toDataURL("image/png");
							// if (imgPreview)
							// 	imgPreview.src = imgSrc;
						}
					});
					const croppedCanvas = cropper.getCroppedCanvas();

					// Round
					getRoundedCanvas(croppedCanvas);
				}
			};
			const target = event.target as HTMLInputElement;
			if (target.files)
				reader.readAsDataURL(target.files[0]);
			this.container.appendChild(this.image);

			const uploadButton = document.createElement('button');
			uploadButton.className = 'text-(--color-text-accent) hover:text-(--color-text-accent2) bg-(--color-accent) hover:bg-(--color-accent2) focus:ring-4 focus:outline-none focus:ring-(--color-form-accent) font-medium rounded-md text-sm px-5 py-2.5 mt-5 text-center';
			uploadButton.innerText = 'Upload';
			uploadButton.addEventListener('click', () => this.sendImageData(cropper));
			this.buttonWrapper.appendChild(uploadButton);
		}
	}

}


export interface SCORE_ScoreDTO {
	data: Date,
	first_user_id: number,
	second_user_id: number,
	first_user_name: string,
	second_user_name: string,
	first_user_score: number,
	second_user_score: number,
	game_mode: string
}
export default class Profile extends Component {
	avatar: HTMLElement;
	popup: HTMLElement | null = null;
	updateAvatarSrc: () => void;
	constructor(tag: string, parent: HTMLElement, dictionary: DictionaryType, avatarSrc: string, updateAvatarSrc: () => void) {
		super(tag, parent, dictionary);
		this.container.className = "flex flex-col h-full items-center bg-(--color-paper-base) justify-center";
		this.avatar = document.createElement('div');
		this.updateAvatarSrc = updateAvatarSrc;
		this.update(avatarSrc);
		this.init();
	}
	createScoreTable(parent: HTMLElement, data: {scores: SCORE_ScoreDTO[], user_id:number}){
		if (data.scores.length === 0)
			return;
		const tableWrapper = document.createElement('div');
		tableWrapper.className = "relative overflow-x-auto shadow-md sm:rounded-lg";

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
			th.innerText = scoreData.first_user_id == data.user_id ? scoreData.first_user_name :  scoreData.second_user_name;
			tr.appendChild(th);

			const dateTd = document.createElement('td');
			dateTd.className = "px-6 py-4";
			dateTd.innerText = new Date(scoreData.data).toDateString();
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
		tableWrapper.appendChild(table);
		parent.appendChild(tableWrapper);

	}
	createChildren(): void {
		const grid = document.createElement('div');
		grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2 w-full justify-items-center';
		this.avatar.setAttribute('id', 'user_avatar');
		this.avatar.className = 'rounded-full shadow-2xl shadow-(color:--color-accent) size-[100px] overflow-hidden';
		this.avatar.addEventListener('click', () => this.avatarEditor(this.container));

		// fetch()
		fetch(`${SCORE_HOSTNAME}/score`, {
			method: "GET",
			headers: {
				"Authorization": getToken(),
			},
		}).then(
			(res) => res.json()
		).then(res => {
			if ('user_id' in res)
			{
				res = res as SCORE_ScoreDTO
				console.log("Score get res: ",res);
				this.createScoreTable(this.container, res);

			}
		});
		// if avatar is not uploaded

		// fetch(`${AUTH_HOSTNAME}/profile`, {
		// 	method: "GET",
		// 	headers: {
		// 		"Authorization": getToken(),
		// 	},
		// }).then((res) => res.json()
		// ).then(res => {
		// 	console.log("Profile get res: ",res);
		// 	if (res.error)
		// 	{
		// 		const emptyAvatar = document.createElement('div');
		// 		emptyAvatar.setAttribute('id', 'upload_avatar');
		// 		emptyAvatar.className = 'relative w-full h-full cursor-pointer [text-shadow:_0_2px_4px_rgb(99_102_241_/_0.8)] flex justify-center text-6xl p-2 bg-(--color-form-base) text-(--color-paper-base)';
		// 		emptyAvatar.innerText = '+';
		// 		this.avatar.appendChild(emptyAvatar);
		// 		return;
		// 	}
		// 	if (res.profile.avatar)
		// 		this.avatar.innerHTML = `<img src="${res.profile.avatar}"/>`;
		// });
		// const emptyAvatar = document.createElement('div');
		// emptyAvatar.setAttribute('id', 'upload_avatar');
		// emptyAvatar.className = 'relative w-full h-full cursor-pointer [text-shadow:_0_2px_4px_rgb(99_102_241_/_0.8)] flex justify-center text-6xl p-2 bg-(--color-form-base) text-(--color-paper-base)';
		// emptyAvatar.innerText = '+';
		// this.avatar.appendChild(emptyAvatar);

		// this.avatar.innerText = '+';
		const name = document.createElement('div');
		name.className = 'col-span-1 col-start-1';
		name.innerHTML = 'NameOfUser';
		grid.appendChild(this.avatar);
		grid.appendChild(name);

		this.container.appendChild(grid);
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
		new ImageEditor(editor, buttonWrapper, this.avatar);
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
			emptyAvatar.className = 'relative w-full h-full cursor-pointer [text-shadow:_0_2px_4px_rgb(99_102_241_/_0.8)] flex justify-center text-6xl p-2 bg-(--color-form-base) text-(--color-paper-base)';
			emptyAvatar.innerText = '+';
			this.avatar.appendChild(emptyAvatar);
		}
		else
			this.avatar.innerHTML = `<img src="${avatar}"/>`;
	}

}
