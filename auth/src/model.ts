export interface AUTH_IsAuthResponse {
	userId?: number,
	error?: string
}

export interface AUTH_UserDTO {
	id: number,
	name: string,
	email: string,
	password: string;
}

export interface AUTH_SignInRequestBody {
	name: string,
	email: string,
	password: string
}

export interface AUTH_CreateUserDTO {
	err?: {
		field: string | undefined,
		message: string,
		err_code: string
	},
	message?: string,
	status: number
}

export interface AUTH_LoginRequestBody {
	email: string,
	password: string
}

export interface AUTH_LoginDTO {
	error?: string,
	token?: string
}

export interface AUTH_FriendsRequestBody {
	friends: string[];
}

export interface AUTH_BlocksRequestBody {
	blocks: string[];
}
export interface AUTH_ProfileUpdateRequestBody {
	avatar?: string;
	phone?: string;
}

export interface AUTH_ProfileUpdateResponse {
	message: string,
}

export interface AUTH_AvatarRequestParams {
	name: string
}

export interface AUTH_AvatarDTO {
	avatar: string
}
export interface AUTH_ProfileResponse {
	id: number;
	user_id: number;
	avatar: string;
	phone: string;
}

export interface AUTH_ProfileDTO {
	profile?: {
		avatar: string;
		phone: string;
	}
	error?: string;
}

export interface AUTH_UserDeleteDTO {
	message: string,
}

export interface AUTH_ServerErrorDTO {
	error: string,
	details: unknown
}

export interface AUTH_AuthErrorDTO {
	error: string,
}
export interface AUTH_GetUserDTO {
	user: {
		id: number,
		name: string,
		email: string
	}
}
