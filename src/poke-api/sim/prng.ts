/**
 * PRNG
 *
 * Esto simula el PRNG (Generador de Números Pseudoaleatorios) utilizado en los juegos reales.
 *
 * Además de permitirnos potencialmente leer repeticiones desde el juego,
 * también hace posible registrar un "log de entrada" (una semilla +
 * equipos iniciales + decisiones de movimiento/cambio) y "reproducir" una simulación
 * para obtener el mismo resultado.
 */

import { Chacha20 } from 'ts-chacha20';
import { Utils } from '../lib/utils';

export type PRNGSeed = `${'sodium' | 'gen5' | number},${string}`;
export type SodiumRNGSeed = ['sodium', string];
/** 64-bit big-endian [high -> low] int */
export type Gen5RNGSeed = [number, number, number, number];

/**
 * Fuente de bajo nivel de números aleatorios de 32 bits.
 */
interface RNG {
	getSeed(): PRNGSeed;
	/** random 32-bit number */
	next(): number;
}

/**
 * API de PRNG de alto nivel para obtener números aleatorios.
 *
 * Elige la implementación de RNG basada en la semilla pasada al constructor.
 * Las semillas que comienzan con 'sodium' usan sodium. Otras semillas usan el RNG de Gen 5.
 * Si no se proporciona una semilla, se usa sodium por defecto.
 *
 * La fuente real de aleatoriedad está en this.rng.
 */
export class PRNG {
	readonly startingSeed: PRNGSeed;
	rng!: RNG;

	/** Crea una nueva fuente de aleatoriedad para la semilla dada. */
	constructor(seed: PRNGSeed | null = null, initialSeed?: PRNGSeed) {
		if (!seed) seed = PRNG.generateSeed();
		if (Array.isArray(seed)) {
			// compatibilidad con registros de entrada antiguos
			seed = seed.join(',') as PRNGSeed;
		}
		if (typeof seed !== 'string') {
			throw new Error(`PRNG: Seed ${seed} must be a string`);
		}
		this.startingSeed = initialSeed ?? seed;
		this.setSeed(seed);
	}

	setSeed(seed: PRNGSeed) {
		if (seed.startsWith('sodium,')) {
			this.rng = new SodiumRNG(seed.split(',') as SodiumRNGSeed);
		} else if (seed.startsWith('gen5,')) {
			const gen5Seed = [seed.slice(5, 9), seed.slice(9, 13), seed.slice(13, 17), seed.slice(17, 21)];
			this.rng = new Gen5RNG(gen5Seed.map(n => parseInt(n, 16)) as Gen5RNGSeed);
		} else if (/[0-9]/.test(seed.charAt(0))) {
			this.rng = new Gen5RNG(seed.split(',').map(Number) as Gen5RNGSeed);
		} else {
			throw new Error(`Unrecognized RNG seed ${seed}`);
		}
	}
	getSeed(): PRNGSeed {
		return this.rng.getSeed();
	}

/**
 * Crea un clon del PRNG actual.
 *
 * El nuevo PRNG tendrá su semilla inicial configurada con la semilla de la instancia actual.
 */
	clone(): PRNG {
		return new PRNG(this.rng.getSeed(), this.startingSeed);
	}

	/**
	 * Recupera el siguiente número aleatorio en la secuencia.
	 * Esta función tiene tres resultados diferentes, dependiendo de los argumentos:
	 * - random() devuelve un número real en [0, 1), igual que Math.random()
	 * - random(n) devuelve un número entero en [0, n)
	 * - random(m, n) devuelve un número entero en [m, n)
	 * m y n se convierten a enteros mediante Math.floor. Si el resultado es NaN, se ignoran.
	 */
	random(from?: number, to?: number): number {
		const result = this.rng.next();

		if (from) from = Math.floor(from);
		if (to) to = Math.floor(to);
		if (from === undefined) {
			return result / 2 ** 32;
		} else if (!to) {
			return Math.floor(result * from / 2 ** 32);
		} else {
			return Math.floor(result * (to - from) / 2 ** 32) + from;
		}
	}

	/**
	 * Lanza una moneda (dado de dos caras), devolviendo true o false.
	 *
	 * Esta función devuelve true con probabilidad `P`, donde `P = numerator
	 * / denominator`. Esta función devuelve false con probabilidad `1 - P`.
	 *
	 * El numerador debe ser un número entero no negativo (`>= 0`).
	 *
	 * El denominador debe ser un número entero positivo (`> 0`).
	 */
	randomChance(numerator: number, denominator: number): boolean {
		return this.random(denominator) < numerator;
	}

	/**
	 * Devuelve un elemento aleatorio del array dado.
	 *
	 * Esta función elige elementos en el array con igual probabilidad.
	 *
	 * Si hay elementos duplicados en el array, cada duplicado se considera por separado.
	 * Por ejemplo, sample(['x', 'x', 'y']) devuelve 'x' el 67% del tiempo y 'y' el 33% del tiempo.
	 *
	 * El array debe contener al menos un elemento.
	 *
	 * El array no debe ser disperso.
	 */
	sample<T>(items: readonly T[]): T {
		if (items.length === 0) {
			throw new RangeError(`Cannot sample an empty array`);
		}
		const index = this.random(items.length);
		const item = items[index];
		if (item === undefined && !Object.prototype.hasOwnProperty.call(items, index)) {
			throw new RangeError(`Cannot sample a sparse array`);
		}
		return item;
	}

	/**
	 * Un barajado de Fisher-Yates. Así es como el juego resuelve los empates de velocidad.
	 *
	 * Al menos según V4 en
	 * https://github.com/smogon/pokemon-showdown/issues/1157#issuecomment-214454873
	 */
	shuffle<T>(items: T[], start = 0, end: number = items.length) {
		while (start < end - 1) {
			const nextIndex = this.random(start, end);
			if (start !== nextIndex) {
				[items[start], items[nextIndex]] = [items[nextIndex], items[start]];
			}
			start++;
		}
	}

	static generateSeed(): PRNGSeed {
		return PRNG.convertSeed(SodiumRNG.generateSeed());
	}
	static convertSeed(seed: SodiumRNGSeed | Gen5RNGSeed): PRNGSeed {
		return seed.join(',') as PRNGSeed;
	}
	static get(prng?: PRNG | PRNGSeed | null) {
		return prng && typeof prng !== 'string' && !Array.isArray(prng) ? prng : new PRNG(prng as PRNGSeed);
	}
}

/**
 * Este es un reemplazo directo para randombytes_buf_deterministic de libsodium,
 * pero está implementado con ts-chacha20 en su lugar, para una dependencia más pequeña que
 * no usa módulos nativos de NodeJS, para una mejor portabilidad.
 */
export class SodiumRNG implements RNG {
	// nonce elegido para ser compatible con randombytes_buf_deterministic de libsodium
	// https://github.com/jedisct1/libsodium/blob/ce07d6c82c0e6c75031cf627913bf4f9d3f1e754/src/libsodium/randombytes/randombytes.c#L178
	static readonly NONCE = Uint8Array.from([..."LibsodiumDRG"].map(c => c.charCodeAt(0)));
	seed!: Uint8Array;
	/** Crea una nueva fuente de aleatoriedad para la semilla dada. */
	constructor(seed: SodiumRNGSeed) {
		this.setSeed(seed);
	}

	setSeed(seed: SodiumRNGSeed) {
		// randombytes_buf_deterministic requiere 32 bytes, pero
		// generateSeed genera 16 bytes, por lo que los últimos 16 bytes serán 0
		// al comenzar. Esto no debería causar ningún problema.
		const seedBuf = new Uint8Array(32);
		Utils.bufWriteHex(seedBuf, seed[1].padEnd(64, '0'));
		this.seed = seedBuf;
	}
	getSeed(): PRNGSeed {
		return `sodium,${Utils.bufReadHex(this.seed)}`;
	}

	next() {
		const zeroBuf = new Uint8Array(36);
		// probado para hacer exactamente lo mismo que
		// sodium.randombytes_buf_deterministic(buf, this.seed);
		const buf = new Chacha20(this.seed, SodiumRNG.NONCE).encrypt(zeroBuf);

		// usar los primeros 32 bytes para la siguiente semilla, y los siguientes 4 bytes para la salida
		this.seed = buf.slice(0, 32);
		// lectura en big-endian
		return buf.slice(32, 36).reduce((a, b) => a * 256 + b);
	}

	static generateSeed(): SodiumRNGSeed {
		const seed = new Uint32Array(4);
		// TODO: Arreglar ese problema de @types/node >14
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore Web Crypto no está realmente en Node 18
		if (typeof crypto === 'undefined') globalThis.crypto = require('node:crypto');
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore Web Crypto _está_ disponible en Node más reciente
		crypto.getRandomValues(seed);
		// 32 bits cada uno, 128 bits en total (16 bytes)
		const strSeed = seed[0].toString(16).padStart(8, '0') +
			seed[1].toString(16).padStart(8, '0') +
			seed[2].toString(16).padStart(8, '0') +
			seed[3].toString(16).padStart(8, '0');
		return [
			'sodium',
			strSeed,
		];
	}
}

/**
 * Un PRNG destinado a emular el PRNG en el cartucho para Gen 5 con una semilla inicial de 64 bits.
 */
export class Gen5RNG implements RNG {
	seed: Gen5RNGSeed;
	/** Crea una nueva fuente de aleatoriedad para la semilla dada. */
	constructor(seed: Gen5RNGSeed | null = null) {
		this.seed = [...seed || Gen5RNG.generateSeed()];
	}

	getSeed(): PRNGSeed {
		return this.seed.join(',') as PRNGSeed;
	}

	next(): number {
		this.seed = this.nextFrame(this.seed); // Avanzar el RNG
		return (this.seed[0] << 16 >>> 0) + this.seed[1]; // Usar los 32 bits superiores
	}

	/**
	 * Calcula `a * b + c` (con enteros de complemento a 2 de 64 bits)
	 */
	multiplyAdd(a: Gen5RNGSeed, b: Gen5RNGSeed, c: Gen5RNGSeed) {
		// Si has hecho multiplicación larga, esto es lo mismo.
		const out: Gen5RNGSeed = [0, 0, 0, 0];
		let carry = 0;

		for (let outIndex = 3; outIndex >= 0; outIndex--) {
			for (let bIndex = outIndex; bIndex < 4; bIndex++) {
				const aIndex = 3 - (bIndex - outIndex);

				carry += a[aIndex] * b[bIndex];
			}
			carry += c[outIndex];

			out[outIndex] = carry & 0xFFFF;
			carry >>>= 16;
		}

		return out;
	}

	/**
	 * El RNG es un Generador Congruencial Lineal (LCG) en la forma: `x_{n + 1} = (a x_n + c) % m`
	 *
	 * Donde: `x_0` es la semilla, `x_n` es el número aleatorio después de n iteraciones,
	 *
	 * ````
	 * a = 0x5D588B656C078965
	 * c = 0x00269EC3
	 * m = 2^64
	 * ````
	 */
	nextFrame(seed: Gen5RNGSeed, framesToAdvance = 1): Gen5RNGSeed {
		const a: Gen5RNGSeed = [0x5D58, 0x8B65, 0x6C07, 0x8965];
		const c: Gen5RNGSeed = [0, 0, 0x26, 0x9EC3];

		for (let i = 0; i < framesToAdvance; i++) {
			// seed = seed * a + c
			seed = this.multiplyAdd(seed, a, c);
		}

		return seed;
	}

	static generateSeed(): Gen5RNGSeed {
		return [
			Math.trunc(Math.random() * 2 ** 16),
			Math.trunc(Math.random() * 2 ** 16),
			Math.trunc(Math.random() * 2 ** 16),
			Math.trunc(Math.random() * 2 ** 16),
		];
	}
}