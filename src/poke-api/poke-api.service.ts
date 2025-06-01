import { Injectable } from '@nestjs/common';
import { BattleStream, getPlayerStreams, Teams } from './sim';
import { RandomPlayerAI } from './sim/tools/random-player-ai';

@Injectable()
export class PokeApiService {
  async simulateBattle(): Promise<string[]> {

    const logs: string[] = [];
    const streams = getPlayerStreams(new BattleStream());

    const spec = { formatid: 'gen7customgame' };
    const p1spec = {
      name: 'Bot 1',
      team: Teams.pack(Teams.generate('gen7randombattle')),
    };
    const p2spec = {
      name: 'Bot 2',
      team: Teams.pack(Teams.generate('gen7randombattle')),
    };

    const p1 = new RandomPlayerAI(streams.p1);
    const p2 = new RandomPlayerAI(streams.p2);

    void p1.start();
    void p2.start();

    void streams.omniscient.write(`>start ${JSON.stringify(spec)}\n`);
    void streams.omniscient.write(`>player p1 ${JSON.stringify(p1spec)}\n`);
    void streams.omniscient.write(`>player p2 ${JSON.stringify(p2spec)}\n`);

    for await (const chunk of streams.omniscient) {
      logs.push(chunk);
    }

    return logs
      .flatMap(chunk => chunk.split('\n'))
      .filter(line => line.trim().length > 0);

  }
}