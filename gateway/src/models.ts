// Auth model

// auth/is-auth
export interface AUTH_IsAuthResponse {
	userId?: number,
	error?: string
}

export interface GW_IsAuthDTO {
	isAuth: boolean;
}

// auth/login
export interface AUTH_LoginRequestBody {
	email: string,
	password: string
}

export interface AUTH_LoginDTO {
	error?: string,
	token?: string
}

// auth/signup
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

export interface AUTH_ServerErrorDTO {
	error: string,
	details: unknown
}

export interface AUTH_AuthErrorDTO {
	error: string,
}

export interface AUTH_ProfileUpdateRequestBody {
	avatar?: string;
	phone?: string;
}

export interface AUTH_ProfileUpdateResponse {
	message: string,
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

// Score model

export interface ScoreRequestBody {
	first_user_id: string,
	second_user_id: string,
	first_user_name: string,
	second_user_name: string,
	score: number[],
	game_mode: string
}

