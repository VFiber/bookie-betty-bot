import { config } from './config';

export interface Championship {
    id?: number;
    name: string;
    teams?: string[];
}

export interface ChampionshipWithId extends Omit<Championship, 'id'> {
    id: number;
}

export type Winner = 'A' | 'B' | 'DRAW';

export function isWinnerType(value: any): value is Winner {
    return value === 'A' || value === 'B' || value === 'DRAW';
}

export interface Match {
    championshipId: number;
    /**
     * Azonosító
     */
    id?: number;
    /**
     * Első csapat neve
     */
    teamA: string;
    /**
     * Második csapat neve
     */
    teamB: string;
    /**
     * Azon felhasználónevek listája, akik nem fogadhatnak az A team ellen
     */
    exludeBetAgainstTeamA?: string[];
    /**
     * Azon felhasználónevek listája, akik nem fogadhatnak a B team ellen
     */
    exludeBetAgainstTeamB?: string[];
    /**
     * A mérkőzés kezdésének időpontja
     */
    matchDateTime?: Date;
    /**
     * A fogadások lezárásának időpontja
     */
    betLockDateTime?: Date;
    /**
     * A mérkőzésen szerzett pontok
     */
    resultA?: number;
    /**
     * A mérkőzésen szerzett pontok
     */
    resultB?: number;
    /**
     * A mérkőzés eredménye, ha van
     */
    winner?: Winner;
}

export interface MatchWithId extends Omit<Match, 'id'> {
    id: number;
}

export interface MatchBet {
    /**
     * @see Match.id
     */
    matchId: number;
    /**
     * Discord username
     */
    username: string;

    /**
     * A fogadás időpontja
     */
    betDateTime: Date;

    /**
     * Fogadott összeg
     */
    amount: number;
    /**
     * A várható kimenetel
     */
    winner: Match['winner'];

    won?: boolean;
}

export interface MatchWithBets extends Match {
    bets: MatchBet[];
}

export interface Gambler {
    username: string;
    balance: number;
    betCount: number;
}

export interface GamblerHistory {
    username: Gambler['username'];
    MatchBet: MatchBet;
}

export let defaultChampionshipId: number;

export interface BetApi {

    createChampionship(name: string, teams: string[]): Promise<ChampionshipWithId | false>;

    getChampionship(championshipId: number): Promise<ChampionshipWithId | undefined>;

    getMatch(matchId: number): Promise<MatchWithId | undefined>;

    getMatches(championshipId: number, openOnly: boolean): Promise<MatchWithId[]>;

    createMatch(match: Match): Promise<MatchWithId | false>;

    removeMatch(matchId: string): Promise<boolean>;

    setMatchResult(match: Match): Promise<Match>;

    createGambler(username: string): Promise<Gambler>;

    getGambler(username: string): Promise<Gambler | undefined>;

    createBet(matchBet: MatchBet): Promise<MatchBet>;

    getBets(matchId: number | number[]): Promise<MatchBet[]>;

    getBets(username: string): Promise<MatchBet[]>;

    withdrawBet(matchBet: MatchBet): Promise<boolean>;

    getTeams: (championshipId: number) => Promise<string[]>;
}

export class MockBetApi implements BetApi {
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

    private matchBets: MatchBet[] = [
        {
            username: 'vfiber',
            matchId: 1,
            amount: 10,
            betDateTime: new Date('2023-01-01T10:00:00Z'),
            winner: 'B'
        },
        {
            username: 'seemslegit',
            matchId: 1,
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

    async createMatch(match: Match): Promise<MatchWithId> {
        const length = this.matches.push({
            ...match,
            id: this.matches.length + 1
        });

        return this.matches[length - 1];
    }

    async removeMatch(matchId: string): Promise<boolean> {
        const index = this.matches.findIndex(match => match.id === Number(matchId));
        if (index !== -1) {
            this.matches.splice(index, 1);
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    }

    async setMatchResult(match: MatchWithId): Promise<MatchWithId> {
        const index = this.matches.findIndex(m => m.id === match.id);
        this.matches[index] = match;
        return Promise.resolve(match);
    }

    async getGambler(username: string): Promise<Gambler | undefined> {
        return this.gamblers.find(gambler => gambler.username === username) || this.createGambler(username);
    }

    async createBet(matchBet: MatchBet): Promise<MatchBet> {
        this.matchBets.push(matchBet);
        let gamblerIndex = this.gamblers.findIndex(gambler => gambler.username === matchBet.username);

        this.gamblers[gamblerIndex].balance -= matchBet.amount;

        return Promise.resolve(matchBet);
    }

    async withdrawBet(matchBet: MatchBet): Promise<boolean> {
        const index = this.matchBets.findIndex(bet => bet.matchId === matchBet.matchId && bet.username === matchBet.username);
        if (index !== -1) {
            this.matchBets.splice(index, 1);
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    }

    async getTeams(championshipId: number): Promise<string[]> {
        return this.championships.find(championship => championship.id === championshipId)?.teams || [];
    }

    async createGambler(username: string): Promise<Gambler> {
        const gambler: Gambler = {
            username,
            balance: config.DEFAULT_GAMBLING_AMOUNT,
            betCount: 0
        };
        this.gamblers.push(gambler);

        return gambler;
    }

    async getBets(param: string | number | number[]): Promise<MatchBet[]> {
        if (typeof param === 'string') {
            return this.matchBets.filter(bet => bet.username === String(param));
        }

        if (Array.isArray(param)) {
            return this.matchBets.filter(bet => param.includes(bet.matchId));
        }

        return this.matchBets.filter(bet => bet.matchId === Number(param));
    }
}


export const betApi: BetApi = new MockBetApi();
