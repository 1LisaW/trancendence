import * as fastify from "fastify";
// import * , { FastifyInstance } from "fastify";
// import { FastifyInstance } from "fastify/types/instance";
import * as http from "http";

declare module "fastify" {
  export interface FastifyInstance {
    isAuthenticated (token: string): Promise<{status:number,user_id: number | undefined, isAuth:boolean}>;
	proxyRequest <T>(path: string,
		method: string,
		request: fastify.FastifyRequest,
		reply: fastify.FastifyReply,
		isAuth: boolean):Promise<T>
  }
}
