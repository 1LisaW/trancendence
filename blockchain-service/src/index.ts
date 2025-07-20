'use strict'

import fastify from 'fastify';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Types
interface TournamentScore {
	tournamentId: string;
	playerOneId: number;
	playerTwoId: number;
	playerOneName: string;
	playerTwoName: string;
	score: string;
	gameMode: string;
	timestamp: number;
}

interface StoreScoreRequest {
	tournamentId: string;
	first_user_id: number;
	second_user_id: number;
	first_user_name: string;
	second_user_name: string;
	score: string;
	game_mode: string;
}

interface GetScoreRequest {
	tournamentId: string;
}

// Smart Contract ABI
const CONTRACT_ABI = [
			{
				"inputs": [],
				"stateMutability": "nonpayable",
				"type": "constructor"
			},
			{
				"anonymous": false,
				"inputs": [
					{
						"indexed": true,
						"internalType": "string",
						"name": "tournamentId",
						"type": "string"
					},
					{
						"indexed": false,
						"internalType": "uint256",
						"name": "playerOneId",
						"type": "uint256"
					},
					{
						"indexed": false,
						"internalType": "uint256",
						"name": "playerTwoId",
						"type": "uint256"
					},
					{
						"indexed": false,
						"internalType": "string",
						"name": "playerOneName",
						"type": "string"
					},
					{
						"indexed": false,
						"internalType": "string",
						"name": "playerTwoName",
						"type": "string"
					},
					{
						"indexed": false,
						"internalType": "string",
						"name": "score",
						"type": "string"
					},
					{
						"indexed": false,
						"internalType": "string",
						"name": "gameMode",
						"type": "string"
					},
					{
						"indexed": false,
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					}
				],
				"name": "TournamentScoreStored",
				"type": "event"
			},
			{
				"inputs": [],
				"name": "getAllTournamentIds",
				"outputs": [
					{
						"internalType": "string[]",
						"name": "",
						"type": "string[]"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [],
				"name": "getOwner",
				"outputs": [
					{
						"internalType": "address",
						"name": "",
						"type": "address"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [],
				"name": "getTournamentCount",
				"outputs": [
					{
						"internalType": "uint256",
						"name": "",
						"type": "uint256"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "string",
						"name": "_tournamentId",
						"type": "string"
					}
				],
				"name": "getTournamentScore",
				"outputs": [
					{
						"components": [
							{
								"internalType": "string",
								"name": "tournamentId",
								"type": "string"
							},
							{
								"internalType": "uint256",
								"name": "playerOneId",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "playerTwoId",
								"type": "uint256"
							},
							{
								"internalType": "string",
								"name": "playerOneName",
								"type": "string"
							},
							{
								"internalType": "string",
								"name": "playerTwoName",
								"type": "string"
							},
							{
								"internalType": "string",
								"name": "score",
								"type": "string"
							},
							{
								"internalType": "string",
								"name": "gameMode",
								"type": "string"
							},
							{
								"internalType": "uint256",
								"name": "timestamp",
								"type": "uint256"
							}
						],
						"internalType": "struct PongTournament.TournamentScore",
						"name": "",
						"type": "tuple"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "uint256",
						"name": "_playerId",
						"type": "uint256"
					}
				],
				"name": "getTournamentsByPlayer",
				"outputs": [
					{
						"internalType": "string[]",
						"name": "",
						"type": "string[]"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "string",
						"name": "_tournamentId",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "_playerOneId",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "_playerTwoId",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "_playerOneName",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "_playerTwoName",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "_score",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "_gameMode",
						"type": "string"
					}
				],
				"name": "storeTournamentScore",
				"outputs": [],
				"stateMutability": "nonpayable",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "string",
						"name": "_tournamentId",
						"type": "string"
					}
				],
				"name": "tournamentExistsCheck",
				"outputs": [
					{
						"internalType": "bool",
						"name": "",
						"type": "bool"
					}
				],
				"stateMutability": "view",
				"type": "function"
			},
			{
				"inputs": [
					{
						"internalType": "address",
						"name": "_newOwner",
						"type": "address"
					}
				],
				"name": "transferOwnership",
				"outputs": [],
				"stateMutability": "nonpayable",
				"type": "function"
			}
];

class BlockchainService {
	private provider: ethers.JsonRpcProvider;
	private wallet: ethers.Wallet;
	private contract: ethers.Contract;

	constructor() {
		const rpcUrl = process.env.AVALANCHE_RPC_URL;
		this.provider = new ethers.JsonRpcProvider(rpcUrl);

		const privateKey = process.env.PRIVATE_KEY;
		if (!privateKey) {
		  throw new Error('PRIVATE_KEY environment variable is required');
		}

		this.wallet = new ethers.Wallet(privateKey, this.provider);

		const contractAddress = process.env.CONTRACT_ADDRESS;
		if (!contractAddress) {
		  throw new Error('CONTRACT_ADDRESS environment variable is required');
		}

		this.contract = new ethers.Contract(contractAddress, CONTRACT_ABI, this.wallet);
	}

	async storeScore(scoreData: StoreScoreRequest): Promise<string> {
		try {
			const tx = await this.contract.storeTournamentScore(
				scoreData.tournamentId,
				scoreData.first_user_id,
				scoreData.second_user_id,
				scoreData.first_user_name,
				scoreData.second_user_name,
				scoreData.score,
				scoreData.game_mode
			);
		
			const receipt = await tx.wait();
			return receipt.hash;
		} catch (error) {
			console.error('Error storing score:', error);
			throw error;
		}
	}

	async getScore(tournamentId: string): Promise<TournamentScore> {
		try {
			const result = await this.contract.getTournamentScore(tournamentId);
			
			return {
				tournamentId: result.tournamentId,
				playerOneId: Number(result.playerOneId),
				playerTwoId: Number(result.playerTwoId),
				playerOneName: result.playerOneName,
				playerTwoName: result.playerTwoName,
				score: result.score,
				gameMode: result.gameMode,
				timestamp: Number(result.timestamp)
			};
		} catch (error) {
			console.error('Error getting score:', error);
			throw error;
		}
	}

	async getAllTournamentIds(): Promise<string[]> {
		try {
			return await this.contract.getAllTournamentIds();
		} catch (error) {
			console.error('Error getting tournament IDs:', error);
			throw error;
		}
	}

	async getBalance(): Promise<string> {
		try {
			const balance = await this.provider.getBalance(this.wallet.address);
			return ethers.formatEther(balance);
		} catch (error) {
			console.error('Error getting balance:', error);
			throw error;
		}
	}
}

const Fastify = fastify({ logger: true });

let blockchainService: BlockchainService;

try {
	blockchainService = new BlockchainService();
	console.log('Blockchain service initialized successfully');
} catch (error) {
	console.error('Failed to initialize blockchain service:', error);
	process.exit(1);
}

// Health check endpoint
Fastify.get('/health', async (request, reply) => {
	try {
		const balance = await blockchainService.getBalance();
		return { 
			status: 'ok', 
			service: 'blockchain-service',
			wallet_balance: balance + ' AVAX'
		};
	} catch (error) {
		reply.code(500);
		return { status: 'error', message: 'Blockchain service unavailable' };
	}
});

// Store tournament score on blockchain
Fastify.post<{ Body: StoreScoreRequest }>('/store-score', async (request, reply) => {
	try {
		const scoreData = request.body;

		// Validate required fields
		if (!scoreData.tournamentId || !scoreData.first_user_id || !scoreData.second_user_id || 
			!scoreData.first_user_name || !scoreData.second_user_name || !scoreData.score) {
			reply.code(400);
			return { error: 'Missing required fields' };
		}

		const txHash = await blockchainService.storeScore(scoreData);
		request.log.info(`Transaction hash for tournament ${scoreData.tournamentId}: ${txHash}`);

		return { 
			success: true, 
			transactionHash: txHash,
			message: 'Tournament score stored on blockchain successfully'
		};
	} catch (error: any) {
		console.error('Error storing score:', error);
		reply.code(500);
		return { 
			error: 'Failed to store score on blockchain',
			details: error.message 
		};
	}
});

// Get tournament score from blockchain
Fastify.get<{ Params: GetScoreRequest }>('/get-score/:tournamentId', async (request, reply) => {
	try {
		const { tournamentId } = request.params;

		if (!tournamentId) {
			reply.code(400);
			return { error: 'Tournament ID is required' };
		}

		const score = await blockchainService.getScore(tournamentId);

		return { 
			success: true, 
			data: score 
		};
	} catch (error: any) {
		console.error('Error getting score:', error);
		reply.code(500);
		return { 
			error: 'Failed to get score from blockchain',
			details: error.message 
		};
	}
});

// Get all tournament IDs
Fastify.get('/tournaments', async (request, reply) => {
	try {
		const tournamentIds = await blockchainService.getAllTournamentIds();

		return { 
			success: true, 
			data: tournamentIds 
		};
	} catch (error: any) {
		console.error('Error getting tournament IDs:', error);
		reply.code(500);
		return { 
			error: 'Failed to get tournament IDs from blockchain',
			details: error.message 
		};
	}
});

// Get all tournament scores
Fastify.get('/all-scores', async (request, reply) => {
	try {
		const tournamentIds = await blockchainService.getAllTournamentIds();
		const scores = await Promise.all(
			tournamentIds.map(id => blockchainService.getScore(id))
		);

		return { 
			success: true, 
			data: scores 
		};
	} catch (error: any) {
		console.error('Error getting all scores:', error);
		reply.code(500);
		return { 
			error: 'Failed to get scores from blockchain',
			details: error.message 
		};
	}
});

// Start server
const start = async () => {
	try {
		await Fastify.listen({ port: 8088, host: '0.0.0.0' });
		console.log('Blockchain service listening on port 8088');
	} catch (err) {
		Fastify.log.error(err);
		process.exit(1);
	}
};

start();
