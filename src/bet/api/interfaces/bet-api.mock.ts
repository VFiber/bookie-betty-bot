import { botConfig } from '../../../bot';
import { BetAPI } from '../bet-api.interface';
import { ChampionshipWithId, Gambler, LeaderboardEntry, Match, MatchBet, MatchBetWithId, MatchWithId } from '../models';
import { User } from 'discord.js';
import { randomInt } from 'node:crypto';
import { match } from 'node:assert';

export class MockBetApi implements BetAPI {
    private championships: ChampionshipWithId[] = [
        {
            id: 1,
            name: 'Ut99 1on1 iDM 2023',
            teams: ['Tonfish', 'Trops', 'Fen1x', 'Hex', 'Mclaud*', 'Best', 'WildCAT', 'Wrekahhh', 'FireyFly', 'VolariS', 'frőBácsi', 'Fiber', 'dMrL~', 'CrTz*']
        }
    ];
    private matches: MatchWithId[] = [
        {
            id: 1,
            championshipId: 1,
            teamA: 'Tonfish',
            teamB: 'Trops',
            matchDateTime: new Date('2023-01-01T12:00:00Z'),
            betLockDateTime: new Date('2023-01-01T11:00:00Z'),
            resultA: 1,
            resultB: 2,
            winner: 'B'
        },
        {
            id: 2,
            championshipId: 1,
            teamA: 'Fen1x',
            teamB: 'Hex',
            matchDateTime: new Date('2023-01-01T12:00:00Z'),
            betLockDateTime: new Date('2023-01-01T11:00:00Z'),
            resultA: 2,
            resultB: 1,
            winner: 'A'
        },
        {
            id: 3,
            championshipId: 1,
            teamA: 'Mclaud*',
            teamB: 'Best',
            matchDateTime: new Date('2023-01-01T12:00:00Z'),
            betLockDateTime: new Date('2023-01-01T11:00:00Z')
        },
        {
            id: 4,
            championshipId: 1,
            teamA: 'WildCAT',
            teamB: 'Wrekahhh'
        }
    ];

    private matchBets: MatchBetWithId[] = [
        {
            id: 1,
            username: 'vfiber',
            matchId: 1,
            amount: 10,
            betDateTime: new Date('2023-01-01T10:00:00Z'),
            winner: 'B',
            earnings: 20
        },
        {
            id: 2,
            username: 'seemslegit',
            matchId: 1,
            amount: 10,
            betDateTime: new Date('2023-01-01T10:00:00Z'),
            winner: 'A',
            earnings: -10
        },
        {
            id: 3,
            username: 'vfiber',
            matchId: 4,
            amount: 10,
            betDateTime: new Date('2023-01-01T10:00:00Z'),
            winner: 'A'
        }
    ];

    private gamblers: Gambler[] = [
        {
            username: 'vfiber',
            balance: 90,
            betCount: 1
        }
    ];

    async createChampionship(name: string, teams: string[]): Promise<ChampionshipWithId> {
        const championship: ChampionshipWithId = {
            id: this.championships.length,
            name,
            teams
        };
        const length = this.championships.push(championship);
        return this.championships[length - 1];
    }

    async getChampionship(championshipId: number): Promise<ChampionshipWithId | undefined> {
        return this.championships.find(championship => championship.id === Number(championshipId));
    }

    async getChampionships(): Promise<ChampionshipWithId[]> {
        return this.championships;
    }

    async getMatch(matchId: number): Promise<MatchWithId | undefined> {
        return this.matches.find(match => match.id === Number(matchId));
    }

    async getMatches(championshipId: number, openOnly: boolean = false): Promise<MatchWithId[]> {
        if (!openOnly) {
            return this.matches.filter(match => match.championshipId === championshipId);
        }

        return this.matches.filter(
            match =>
                match.championshipId === championshipId &&
                (!match.betLockDateTime || match.betLockDateTime > new Date()) &&
                (!match.matchDateTime || match.matchDateTime > new Date())
        );
    }

    getLockedMatches(championshipId: number, withoutResultOnly: boolean): Promise<MatchWithId[]> {
        return Promise.resolve(this.matches.filter(match => match.championshipId === championshipId && match.betLockDateTime && (!match.winner || !withoutResultOnly)));
    }

    async createMatch(match: Match): Promise<MatchWithId> {
        const length = this.matches.push({
            ...match,
            id: this.matches.length + 1
        });

        return this.matches[length - 1];
    }

    async lockMatch(match_id: number, betLockDateTime: Date): Promise<MatchWithId> {
        const index = this.matches.findIndex(m => m.id === match_id);

        this.matches[index].betLockDateTime = betLockDateTime;
        return this.matches[index];
    }

    async removeMatch(matchId: number): Promise<boolean> {
        const index = this.matches.findIndex(match => match.id === matchId);
        if (index !== -1) {
            this.matches.splice(index, 1);
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    }

    async setMatchResult(match: MatchWithId): Promise<MatchWithId> {
        const index = this.matches.findIndex(m => m.id === match.id);
        this.matches[index] = match;

        const matchBets = await this.getBets(match.id);
        let winnerBets = matchBets.filter(bet => bet.winner === match.winner);

        // összeszámoljuk az összes fogadás összegét, ekkora összeget kell arányosan szétosztani a nyertesek között
        const totalBetAmount = matchBets.reduce((acc, bet) => acc + bet.amount, 0);
        // összeszámoljuk a nyertesek összegét
        const winnersAmount = winnerBets.reduce((acc, bet) => acc + bet.amount, 0);
        // az arányosan szétosztandó összeg
        const distributedAmount = totalBetAmount - winnersAmount;

        await Promise.all(
            winnerBets.map(async (bet) => {
                //TODO: bank itt lecsíphet %-ot, ha akar
                const ratio = bet.amount / winnersAmount;
                bet.earnings = distributedAmount * ratio + bet.amount;
                await this.finalizeBet(bet.id, bet.earnings);
                await this.addToGamblerBalance(bet.username, bet.earnings);
                return bet;
            })
        );

        await Promise.all(
            matchBets.filter(bet => bet.winner !== match.winner)
                .map(async (bet) => {
                        return await this.finalizeBet(bet.id, bet.amount * -1);
                    }
                )
        );

        return Promise.resolve(this.matches[index]);
    }

    async getGambler(username: string): Promise<Gambler> {
        return this.gamblers.find(gambler => gambler.username === username) || this.createGambler(username);
    }

    async addToGamblerBalance(username: string, amount: number): Promise<boolean> {
        const index = this.gamblers.findIndex(gambler => gambler.username === username);
        if (index === -1) {
            return false;
        }

        this.gamblers[index].balance += amount;
        return true;
    }

    async createBet(matchBet: MatchBet): Promise<MatchBet> {
        this.matchBets.push({
            ...matchBet,
            id: this.matchBets.length
        });

        let gamblerIndex = this.gamblers.findIndex(gambler => gambler.username === matchBet.username);

        this.gamblers[gamblerIndex].balance -= matchBet.amount;

        return Promise.resolve(matchBet);
    }

    async finalizeBet(bet_id: number, eranings: number): Promise<MatchBetWithId> {
        const index = this.matchBets.findIndex(bet => bet.id === bet_id);
        this.matchBets[index].earnings = eranings;
        return this.matchBets[index];
    }

    async withdrawBet(matchBet: MatchBetWithId): Promise<boolean> {
        const index = this.matchBets.findIndex(bet => bet.id === matchBet.id && bet.username === matchBet.username);
        if (index !== -1) {
            this.matchBets.splice(index, 1);
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    }

    async getTeams(championshipId: number): Promise<string[]> {
        return this.championships.find(championship => championship.id === championshipId)?.teams || [];
    }

    async createGambler(user: User): Promise<Gambler> {
        const gambler: Gambler = {
            ...user,
            balance: botConfig.DEFAULT_GAMBLING_AMOUNT,
            betCount: 0
        };
        this.gamblers.push(gambler);

        return gambler;
    }

    async getBets(param: unknown): Promise<MatchBetWithId[]> {
        if (typeof param === 'string') {
            return this.matchBets.filter(bet => bet.username === String(param));
        }

        if (Array.isArray(param)) {
            return this.matchBets.filter(bet => param.includes(bet.matchId));
        }

        return this.matchBets.filter(bet => bet.matchId === param);
    }

    async updateChampionship(championship: ChampionshipWithId): Promise<ChampionshipWithId | false> {
        const champIndex = this.championships.findIndex(champ => champ.id === championship.id);
        if (champIndex === -1) {
            return Promise.resolve(false);
        }
        this.championships[champIndex] = championship;

        return this.championships[champIndex];
    }


    async getTopBetters(): Promise<LeaderboardEntry[]> {
        return this.gamblers
            .map(gambler => (
                {
                    username: gambler.username,
                    globalName: gambler.username,
                    balance: gambler.balance,
                    sumEarnings: randomInt(10),
                    betCount: gambler.betCount
                }
            ))
            .sort((a, b) => b.balance - a.balance);
    }
}
