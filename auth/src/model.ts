import { error } from "console";

export interface ProfileRequestBody {
	avatar?: string;
	phone?: string;
}

export interface ProfileResponse {
	id: number;
	user_id: number;
	avatar: string;
	phone: string;
}

export interface ProfileDTO {
	profile?: {
		avatar: string;
		phone: string;
	}
	error?: string;
}

export interface UserDeleteDTO {
	message?: string,
	error?: string
}
