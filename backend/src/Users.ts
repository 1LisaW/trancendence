import { AUTH_ServerErrorDTO, Auth_UserDTO, AuthUserErrorDTO, delete_user_from_matchmaking, get_user__auth, post_matchmaking__game_service } from "./api";
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
		this.gameUserSockets.get(userId)?.push(socket);

	}
	removeGameSocket(socket: WSocket) {
		const user_id = socket.id;
		if (user_id === undefined)
			return;
		const newState = this.gameUserSockets.get(user_id)?.filter((value) => value != socket) || [];
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
		this.statuses.set(user_id, status);
	}

	getUserStatus(user_id: number) {
		return (this.statuses.get(user_id));
	}

	getUserNameById(user_id: number) {
		console.log("getUserNameById: ", typeof user_id, " ", this.idToUsers.get(user_id), this.idToUsers.keys(), this.idToUsers.values());
		return (this.idToUsers.get(user_id));
	}

	// private remove(user_id: number) {
	// 	this.setStatus(user_id, Status.OFFLINE);
	// 	this.chatUserSockets.delete(user_id);
	// }

	matchmaking(user_id: number, socket: WSocket, mode: 'pvp' | 'pvc') {
		// this.addGameSocket(user_id, socket);
		this.setStatus(user_id, Status.MATCHMAKING);
		console.log("this.matchmaking in process ", socket.id);

		return post_matchmaking__game_service(user_id, mode);
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

	// removeUser = async (user_id: number) => {
	//   this.remove(user_id);
	//   console.log("REMOVED User ", user_id, " has status ", this.getUserStatus(user_id));
	// }
}
