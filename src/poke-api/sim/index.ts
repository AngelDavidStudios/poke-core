/**
* Aquí es donde se exportan todas las APIs del simulador para uso general.
* `require('pokemon-showdown')` importa desde aquí.
*/
// battle simulation

export { Battle } from './battle';
export { BattleStream, getPlayerStreams } from './battle-stream';
export { Pokemon } from './pokemon';
export { PRNG } from './prng';
export { Side } from './side';

// dex API

export { Dex, toID } from './dex';

// teams API

export { Teams } from './teams';
export { TeamValidator } from './team-validator';

// misc libraries

export * from '../lib';
