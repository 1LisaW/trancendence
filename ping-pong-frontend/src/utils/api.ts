import { getToken } from "./auth";

const SESSION_HOSTNAME = "/api/session-management/status";

export const setSessionUserData = async ( state: 'login' | 'logout') => {
	console.log("Frontend setSessionUserData");
	const res = await fetch(`${SESSION_HOSTNAME}/${state}`, {
		method: "POST",
		headers: {
			"Authorization": getToken(),
			// "Content-Type": "application/json",
		},
	});
	switch (res.status) {
		case 200:
			return (true);
			break;

		default:
			return (false)
			break;
	}
}
