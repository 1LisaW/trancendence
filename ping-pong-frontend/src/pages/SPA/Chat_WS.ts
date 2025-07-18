import { ChatTournamentMessage } from "../../model/Chat";
import { getToken } from "../../utils/auth";

class Chat_WS {
	ws: WebSocket | null = null;
	syncChatFromWs: (data: ChatTournamentMessage) => void;

	constructor(syncChatFromWs: (data: ChatTournamentMessage) => void) {
		this.syncChatFromWs = syncChatFromWs;
	}

	init = () => {
		console.log('Chat_WS init');
		if (this.ws)
			return;
		this.ws = new WebSocket('/api/session-management/ws/chat', getToken());
		this.ws.onopen = () => console.log('WebSocket is connected!')
		// 4
		this.ws.onmessage = (msg) => {
			const message = msg.data;
			const data: ChatTournamentMessage = JSON.parse(message);
			console.log('I got a message!', message, data)
			if (data.recipient === 'tournament' || data.recipient === 'chat') {
			// 	// console.log('message.recipient === tournament');
				this.syncChatFromWs(data);
				// if (data.event === 'match') {}
			}
			//   message.innerHTML += `<br /> ${message}`
		}
		// 5
		this.ws.onerror = (error) => console.log('WebSocket error', error)
		// 6
		this.ws.onclose = () => console.log('Disconnected from the WebSocket server')
	}
	close = () => {
		console.log('Chat_WS close');

		if (!this.ws)
			return;
		this.ws.close();
		this.ws = null;
	}

	// joinTournament = () => {
	// 	if (!this.ws)
	// 		return;
	// 	this.ws.send(JSON.stringify({ recipient: 'tournament', event: 'join' }));
	// }

	// acceptTournamentMatch = (reply: boolean) => {
	// 	if (!this.ws)
	// 		return;
	// 	this.ws.send(JSON.stringify({ recipient: 'tournament', event: 'match', accept: reply }));
	// }

	send = (message: string) => {
		if (!this.ws)
			return;
		this.ws.send(message);
	}

}

export default Chat_WS;
