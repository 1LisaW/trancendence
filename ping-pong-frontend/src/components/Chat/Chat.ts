function createCustomElement(tag: string, className: string) {
	const element = document.createElement(tag);
	element.className = className;
	return element;
}

enum MessageType {
	TOURNAMENT,
	TOURNAMENT_MATCH,
	INFO,
	SELF,
	USER
}

// interface Message {
// 	type: MessageType,
// 	user: string,
// 	message: string,
// 	date: number,
// }

class Chat {
	container: HTMLElement | null = null;
	chatBlock: HTMLElement | null = null;
	chatWrapper: HTMLElement | null = null;
	unreadIcon: HTMLElement | null = null;
	isClosed = true;
	unreadCount = 0;
	constructor() {
		//this.parent = parent;
		this.initChat();
		this.addChatBubble('user1', '11:35', 'message', 1);
		this.addChatBubble('user2', '11:37', 'reply', 1);
		this.addJoinTournament(Date.now());
		this.addInviteToTournamentMatch(Date.now());
	}

	toggleChat = () => {
		if (this.chatWrapper)
			this.chatWrapper.classList.toggle('invisible');
		this.isClosed = !this.isClosed;
		if (this.unreadIcon && (!this.isClosed || this.unreadCount === 0))
			this.unreadIcon.classList.add('invisible');
		if (!this.isClosed)
		{
			this.unreadCount = 0;
			if (this.unreadIcon)
				this.unreadIcon.innerText = this.unreadCount.toString();
		}
	}

	updateUnreadIcon = () => {

		if (this.isClosed && this.unreadIcon)
		{
			this.unreadCount++;
			this.unreadIcon.innerText = this.unreadCount.toString();
			this.unreadIcon.classList.remove('invisible');
		}
	}

	initChat() {
		const chatBlockWrapper = createCustomElement('div', 'fixed z-15 bottom-0 right-0 flex flex-col gap-1 items-end m-1');
		this.container = chatBlockWrapper;
		const chatWrapper = document.createElement('div');
		chatWrapper.className = 'invisible border-1 border-solid  rounded-t-lg w-64 justify-center bg-(--color-paper-base)';
		this.chatWrapper = chatWrapper;
		chatBlockWrapper.appendChild(chatWrapper);

		const chatHeader = document.createElement('div');
		chatHeader.className = 'h-6 bg-(--color-accent) rounded-t-lg';
		chatWrapper.appendChild(chatHeader);
		const chatBlock = document.createElement('div');
		chatBlock.className = ' h-32 w-full overflow-y-scroll ';
		this.chatBlock = chatBlock;
		chatWrapper.appendChild(chatBlock);
		const inputBlock = document.createElement('div');
		inputBlock.className = 'flex flex-col align-center justify-center h-32 w-full';
		const textBlock = document.createElement('textarea');
		textBlock.className = ' m-auto w-[80%] rounded-lg h-15 border-1 border-solid';
		inputBlock.appendChild(textBlock);
		const sendButton = document.createElement('button');
		sendButton.className = 'cursor ml-auto mr-2 mb-2 p-1 w-30 rounded-lg text-(--color-text-accent) hover:text-(--color-text-accent2) bg-(--color-accent) hover:bg-(--color-accent2) focus:ring-4 focus:outline-none focus:ring-(--color-form-accent)';
		sendButton.innerText = 'Send';
		inputBlock.appendChild(sendButton);
		chatWrapper.appendChild(inputBlock);

		// document.body.appendChild(chatBlockWrapper);

		const iconBlock = createCustomElement('button', 'relative w-10 h-10 flex justify-center align-center pt-1 rounded-lg text-(--color-text-accent) hover:text-(--color-text-accent2) bg-(--color-accent) hover:bg-(--color-accent2) focus:ring-4 focus:outline-none focus:ring-(--color-form-accent)');
		iconBlock.addEventListener('click', () => this.toggleChat());
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.classList.add('fill-none', 'stroke-white', 'h-8', 'w-8');
		svg.setAttributeNS(null, 'viewBox', '0 0 24 24');
		svg.setAttributeNS(null, 'width', '24');
		svg.setAttributeNS(null, 'height', '24');

		const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttributeNS(null, 'd', 'M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z');
		svg.appendChild(path);
		iconBlock.appendChild(svg);
		const unread = createCustomElement('div', 'absolute inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 border-1 border-white rounded-full -top-1 -end-1 dark:border-gray-900');
    	unread.innerText = this.unreadCount.toString();
    	iconBlock.appendChild(unread);
		this.unreadIcon = unread;
		chatBlockWrapper.appendChild(iconBlock);

	}


	addJoinTournament(time: number) {
		const date = new Date(time);
		const timeInfo = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
		const messageBlock = this.addChatBubble('tournament', timeInfo, 'join tournament!!!', 0);
		const buttonBlock = createCustomElement('div', 'flex justify-between items-center');
		const joinButton = createCustomElement('button', 'text-sm text-blue-700 dark:text-blue-500 font-medium inline-flex items-center hover:underline');
		joinButton.innerText = 'Join';
		buttonBlock.appendChild(joinButton);
		const declineButton = createCustomElement('button', 'text-sm text-blue-700 dark:text-blue-500 font-medium inline-flex items-center hover:underline');
		declineButton.innerText = 'Decline';
		buttonBlock.appendChild(declineButton);
		messageBlock.appendChild(buttonBlock);
	}

	addInviteToTournamentMatch(time: number) {
		const date = new Date(time);
		const timeInfo = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
		const messageBlock = this.addChatBubble('tournament', timeInfo, 'you have match to participate', 0);
		const buttonBlock = createCustomElement('div', 'flex justify-between items-center');
		const joinButton = createCustomElement('button', 'text-sm text-blue-700 dark:text-blue-500 font-medium inline-flex items-center hover:underline');
		joinButton.innerText = 'Join';
		buttonBlock.appendChild(joinButton);
		const forfeitButton = createCustomElement('button', 'text-sm text-blue-700 dark:text-blue-500 font-medium inline-flex items-center hover:underline');
		let count = Math.round((time - Date.now() + 30000) / 1000);
		forfeitButton.innerText = `Forfeit (${count} sec)`;
		const countDown = setInterval(() => {
			count = Math.round((time - Date.now() + 30000) / 1000);
			if (count <= 0)
				clearInterval(countDown);
			forfeitButton.innerText = `Forfeit (${count} sec)`;
		}, 1000);
		buttonBlock.appendChild(forfeitButton);
		messageBlock.appendChild(buttonBlock);
	}


	addChatBubble(user: string, time: string, message: string, messageType: MessageType) {
		this.updateUnreadIcon();
		const bubble = document.createElement('div');
		bubble.className = 'flex items-start gap-2.5 mt-2 p-1';
		const img = document.createElement('img');
		img.className = 'w-8 h-8 rounded-full';
		if (messageType == MessageType.SELF)
			img.classList.add('order-2');
		img.setAttribute('src', 'https://lumiere-a.akamaihd.net/v1/images/a_avatarpandorapedia_jakesully_16x9_1098_02_b13c4171.jpeg?region=0%2C60%2C1920%2C960');
		bubble.appendChild(img);
		const messageBlock = document.createElement('div');
		messageBlock.className = ' flex flex-col w-full max-w-[326px] leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-xl rounded-es-xl dark:bg-gray-700';
		;
		const messageBlockHeader = document.createElement('div');
		messageBlockHeader.className = 'flex items-center space-x-2 rtl:space-x-reverse mb-2';
		const userNameHeader = document.createElement('span');
		userNameHeader.className = 'text-sm font-semibold text-gray-900 dark:text-white';
		userNameHeader.innerText = user;
		const messageTime = document.createElement('span');
		messageTime.className = 'text-sm font-normal text-gray-500 dark:text-gray-400';
		messageTime.innerText = time;
		messageBlockHeader.appendChild(userNameHeader);
		messageBlockHeader.appendChild(messageTime);
		messageBlock.appendChild(messageBlockHeader);
		bubble.appendChild(messageBlock);

		const messageText = document.createElement('p');
		messageText.className = 'text-sm font-normal text-gray-900 dark:text-white';
		messageText.innerText = message;
		messageBlock.appendChild(messageText);

		/*  const buttonBlock = createCustomElement('div','flex justify-between items-center');
		 const joinButton = createCustomElement('button', 'text-sm text-blue-700 dark:text-blue-500 font-medium inline-flex items-center hover:underline');
		 joinButton.innerText = 'Join';
		 buttonBlock.appendChild(joinButton);
		 const forfeitButton = createCustomElement('button', 'text-sm text-blue-700 dark:text-blue-500 font-medium inline-flex items-center hover:underline');
		 forfeitButton.innerText = 'Forfeit';
		 buttonBlock.appendChild(forfeitButton);
		 messageBlock.appendChild(buttonBlock); */
		if (this.chatBlock)
			this.chatBlock.appendChild(bubble);
		return messageBlock;
	}
}

export default Chat;
