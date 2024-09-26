import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import {
	Keypair,
	LAMPORTS_PER_SOL,
	PublicKey,
	SystemProgram,
	Transaction,
} from "@solana/web3.js";
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	TOKEN_PROGRAM_ID,
	getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";

import { CounterProgram } from "../target/types/counter_program";

describe("Counter Program", () => {
	const provider = anchor.getProvider();

	const connection = provider.connection;

	const program = anchor.workspace.CounterProgram as Program<CounterProgram>;

	const user = Keypair.generate();

	const [counter, counterBump] = PublicKey.findProgramAddressSync(
		[Buffer.from("counter"), user.publicKey.toBuffer()],
		program.programId
	);

	const userProvider = new anchor.AnchorProvider(
		connection,
		new anchor.Wallet(user),
		anchor.AnchorProvider.defaultOptions()
	);

	anchor.setProvider(userProvider);

	const userProgram = new anchor.Program(
		program.idl,
		program.programId,
		userProvider
	);

	const confirm = async (signature: string): Promise<string> => {
		const block = await connection.getLatestBlockhash();
		await connection.confirmTransaction({
			signature,
			...block,
		});
		return signature;
	};

	const log = async (signature: string): Promise<string> => {
		console.log(
			`Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=custom&customUrl=${connection.rpcEndpoint}`
		);
		return signature;
	};

	const accountsPublicKeys = {
		user: user.publicKey,
		counter,
		associatedTokenprogram: ASSOCIATED_TOKEN_PROGRAM_ID,

		tokenProgram: TOKEN_PROGRAM_ID,

		systemProgram: SystemProgram.programId,
	};

	it("setup", async () => {
		let lamports = await getMinimumBalanceForRentExemptMint(connection);
		let tx = new Transaction();
		tx.instructions = [
			SystemProgram.transfer({
				fromPubkey: provider.publicKey,
				toPubkey: user.publicKey,
				lamports: 10 * LAMPORTS_PER_SOL,
			}),
		];

		await provider.sendAndConfirm(tx).then(log);
	});

	it("Initialize", async () => {
		const accounts = {
			counter: accountsPublicKeys["counter"],
			systemProgram: accountsPublicKeys["systemProgram"],
			user: accountsPublicKeys["user"],
		};

		try {
			await userProgram.methods
				.initialize()
				.accounts({ ...accounts })
				.rpc()
				.then(confirm)
				.then(log);

			const count = (
				await program.account.counter.fetch(counter)
			).count.toNumber();
			console.log("Count", count);
		} catch (error) {
			console.error("Transaction failed:", error);
			if ("logs" in error) {
				console.error("Transaction logs:", error.logs);
			}
			throw error;
		}
	});

	it("Increment", async () => {
		const accounts = {
			counter: accountsPublicKeys["counter"],
			systemProgram: accountsPublicKeys["systemProgram"],
			user: accountsPublicKeys["user"],
		};

		try {
			await userProgram.methods
				.increment(new anchor.BN(100))
				.accounts({ ...accounts })
				.rpc()
				.then(confirm)
				.then(log);

			const count = (
				await program.account.counter.fetch(counter)
			).count.toNumber();
			console.log("Count", count);
		} catch (error) {
			console.error("Transaction failed:", error);
			if ("logs" in error) {
				console.error("Transaction logs:", error.logs);
			}
			throw error;
		}
	});

	it("Decrement", async () => {
		const accounts = {
			counter: accountsPublicKeys["counter"],
			systemProgram: accountsPublicKeys["systemProgram"],
			user: accountsPublicKeys["user"],
		};

		try {
			await userProgram.methods
				.decrement(new anchor.BN(50))
				.accounts({ ...accounts })
				.rpc()
				.then(confirm)
				.then(log);

			const count = (
				await program.account.counter.fetch(counter)
			).count.toNumber();
			console.log("Count", count);
		} catch (error) {
			console.error("Transaction failed:", error);
			if ("logs" in error) {
				console.error("Transaction logs:", error.logs);
			}
			throw error;
		}
	});
});
