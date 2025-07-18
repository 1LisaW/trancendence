import { AUTH_ServerErrorDTO, Auth_UserDTO, AuthUserErrorDTO, delete_user_from_matchmaking, get_user__auth, get_user_blocks, post_matchmaking__game_service, post_matchmaking_with_specific_user__game_service, post_new_ai_session } from "./api";
import { Status, WSocket } from "./model";

export class Users {
	private userPool: Set<string> = new Set(); // name
	private idToUsers: Map<number, string> = new Map(); // user_id : name
	private usersTokens: Map<number, string> = new Map(); // user_id: token

	private statuses: Map<number, Status> = new Map(); // user_id: status
	private gameUserSockets: Map<number, WSocket[]> = new Map(); // user_id: socket
	private chatUserSockets: Map<number, WSocket[]> = new Map(); // user_id: socket

	private add(userId: number, login: string, token: string) {
		// if (this.userPool.has(login) && this.statuses[login] !== Status.OFFLINE)
		// return;
		if (!this.userPool.has(login)) {
			this.userPool.add(login);
			this.idToUsers.set(userId, login);
			this.setStatus(userId, Status.ONLINE);
			this.chatUserSockets.set(userId, []);
			this.gameUserSockets.set(userId, []);
		}
		this.usersTokens.set(userId, token);
		if (this.getUserStatus(userId) === Status.OFFLINE)
			this.setStatus(userId, Status.ONLINE);
	}

	addChatUserSocket(userId: number, socket: WSocket) {
		this.chatUserSockets.get(userId)?.push(socket);
	}

	removeChatUserSocket(socket: WSocket) {
		const user_id = socket.id;
		if (user_id === undefined)
			return;
		const newState = this.chatUserSockets.get(user_id)?.filter((value) => value != socket) || [];
		this.chatUserSockets.set(user_id, newState);

		if (newState.length === 0)
		{
			this.setStatus(user_id, Status.OFFLINE);
			this.gameUserSockets.set(user_id, []);
		}
	}

	getChatUserSocketById(userId: number) {
		return this.chatUserSockets.get(userId);
	}
	addGameSocket(userId: number, socket: WSocket) {
		if (this.gameUserSockets.has(userId) === false) {
			this.gameUserSockets.set(userId, []);
		}
		this.gameUserSockets.get(userId)?.push(socket);
	}

	addUsersGameSocket(user_id: number, socket: WSocket) {
		 socket.id = user_id;
     	 this.addGameSocket(user_id, socket);
	}


	addAIGameSocket(user_id: number, socket: WSocket) {
		socket.id = user_id; // AI session id
		this.addGameSocket(user_id, socket);
		socket.timeStamp = Date.now();
	}

	removeGameSocket(socket: WSocket) {
		const user_id = socket.id;
		if (user_id === undefined)
			return;
		const newState = this.gameUserSockets.get(user_id)?.filter((value) => value != socket) || [];
		if (user_id < 0) {
			this.gameUserSockets.delete(user_id);
			this.userPool.delete(user_id.toString());
			return;
		}
		this.gameUserSockets.set(user_id, newState)
		if (this.getUserStatus(user_id) === Status.PLAYING && newState.length === 0)
			this.setStatus(user_id, Status.ONLINE);
	}

	gameSocketIsAlive(userId: number) {
		// const socket = this.gameUserSockets.get(userId);
		if (this.gameUserSockets.has(userId) && this.getGameSocketById(userId)?.length)
			return (true);
		return (false);
	}

	getGameSocketById(userId: number) {
		return this.gameUserSockets.get(userId);
	}

	private setStatus(user_id: number, status: Status) {
		console.log("🕵🏻‍♀️ USER: ", user_id, " changed status to ", status.toString());
		this.statuses.set(user_id, status);
	}

	getUserStatus(user_id: number) {
		return (this.statuses.get(user_id));
	}

	//getUserNameById(user_id: number) {
	//	console.log("getUserNameById: ", typeof user_id, " ", this.idToUsers.get(user_id), this.idToUsers.keys(), this.idToUsers.values());
	//	return (this.idToUsers.get(user_id));
	//}

	// Simona -POTENTIAL CHANGE TO HANDLE AI PLAYER
	getUserNameById(user_id: number) {
		if (user_id < 0) return 'AI'; // Handle AI player
		console.log("getUserNameById: ", typeof user_id, " ", this.idToUsers.get(user_id), this.idToUsers.keys(), this.idToUsers.values());
		return (this.idToUsers.get(user_id));
	}


	// private remove(user_id: number) {
	// 	this.setStatus(user_id, Status.OFFLINE);
	// 	this.chatUserSockets.delete(user_id);
	// }

	matchmaking = async (user_id: number, socket: WSocket, mode: 'pvp' | 'pvc' | 'tournament', opponentId?: number) => {
		// console.log("matchmaking user_id: ", user_id, " mode: ", mode, " opponentId: ", opponentId);
		// console.log("this.getUserStatus(user_id): ", this.getUserStatus(user_id));
		// if (opponentId!= undefined)
		// 	console.log(" opponentId: ", opponentId, " this.getUserStatus(opponentId): ", this.getUserStatus(opponentId));
		// if (this.getUserStatus(user_id) !== Status.ONLINE || (opponentId !== undefined && this.getUserStatus(opponentId) !== Status.ONLINE))
		// 	return;
		// this.addGameSocket(user_id, socket);
		switch (mode) {
			case 'pvp':
				this.setStatus(user_id, Status.MATCHMAKING);
				return post_matchmaking__game_service(user_id, mode);
				break;
			case 'pvc':
				this.setStatus(user_id, Status.MATCHMAKING);
				console.log("user.matchmaking::  post_new_ai_session user_id: ", user_id);
        		console.log('IN MATCHMAKING USER');

				const data = await post_new_ai_session(user_id);
				if (!data)
					return ;
				// console.log("+++post_new_ai_session data: ", data);
				const json = await data.json();
				console.log("+++post_new_ai_session json: ", json);
				if ('user_id' in json && parseInt(json.user_id) === -user_id) {
					return  post_matchmaking_with_specific_user__game_service(user_id, mode, json.user_id as number);
				}
				return ;
				// if ('user' in json && ) {}
				// if (this.getUserStatus(user_id) !== Status.ONLINE)
				break;
			case 'tournament':
				if (opponentId !== undefined)
					return post_matchmaking_with_specific_user__game_service(user_id, mode, opponentId);
				break;
			default:
				console.error("Unknown game mode: ", mode);
				return;
		}
		// this.setStatus(user_id, Status.MATCHMAKING);
		// if (opponentId!= undefined)
		// 	this.setStatus(opponentId, Status.MATCHMAKING);
		console.log("this.matchmaking in process ", socket.id);

		// // FIX:: send post only when 2 users sockets exists
		// if (mode === 'tournament' && opponentId !== undefined)
		// 	return post_matchmaking_with_specific_user__game_service(user_id, mode, opponentId);
		// if (mode !== 'tournament')
		// 	return post_matchmaking__game_service(user_id, mode);
	}



	removeUserFromMatchmaking(user_id: number) {
		delete_user_from_matchmaking(user_id);
		if (this.getUserStatus(user_id) === Status.MATCHMAKING)
			this.setStatus(user_id, Status.ONLINE);
	}

	setPlayingStateToUser(user_id:number) {
		this.setStatus(user_id, Status.PLAYING);
	}
	setMatchmakingStateToUser(user_id:number) {
		this.setStatus(user_id, Status.MATCHMAKING);
	}

	setOnlineStatusToUser(user_id: number) {
		this.setStatus(user_id, Status.ONLINE);
	}

	addUser = async (token: string) => {
	  const data = await get_user__auth(token);
	  let json: AuthUserErrorDTO | Auth_UserDTO | AUTH_ServerErrorDTO = await data.json();
	  if (data.status == 401 || data.status == 500) {
		return (json);
	  }
	  json = json as Auth_UserDTO

	  const { id, name } = json.user;
	  this.add(id, name, token);
	  console.log("User ", name, " has status ", this.getUserStatus(id));
	  return (json);
	}

	sendDataToChatSockets(user_id: number, data: any)
	{
		const sockets = this.getChatUserSocketById(user_id);
		if (!sockets)
			return ;
		sockets.forEach(socket => socket.send(JSON.stringify(data)));
	}

	getOnlineUsers = () => {
		let onlineUsers: number[] = [];
		Array.from(this.statuses.entries())
			.reduce((acc, curr) => {
				if(curr[1] === Status.ONLINE)
					acc.push(curr[0])
				return acc;
			}, onlineUsers);
		return (onlineUsers);
	}

	broadcastMessage(user_id: number, message: string) {
		const sender = this.getUserNameById(user_id);
		const date = Date.now();
		const response = {
			recipient: 'chat',
			event: 'message',
			sender,
			date,
			message,
			is_self: false
		}
		const onlineUsers = this.getOnlineUsers();
		onlineUsers.forEach( async(user: number)=> {
			if (user_id == user) {
				this.sendDataToChatSockets(user_id, {...response, is_self: true});
				return;
			}
			const data = await get_user_blocks(user);
			const user_blocks: {blocks:number[]} | undefined = await data.json();
			console.log("USER: ", user_id, " blocks: ", user_blocks);
			if (
				!user_blocks ||
				(user_blocks && 'blocks' in user_blocks && !user_blocks.blocks.some((el: any) => el.blocked_id === user_id))
			) {
				this.sendDataToChatSockets(user, response);
			}
		})
	}

	// removeUser = async (user_id: number) => {
	//   this.remove(user_id);
	//   console.log("REMOVED User ", user_id, " has status ", this.getUserStatus(user_id));
	// }
}
