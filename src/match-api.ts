export interface Championship {
    id?: number;
    name: string;
    teams?: string[];
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
    winner?: 'A' | 'B' | 'DRAW';
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

    won: boolean;
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

export interface MatchApi {

    createChampionship(name: string): Promise<Championship>;

    getMatch(matchId: string): Promise<Match | undefined>;

    getMatches(championshipId: string): Promise<Match[]>;

    createMatch(match: Match): Promise<Match>;

    removeMatch(matchId: string): Promise<boolean>;

    setMatchResult(match: Match): Promise<Match>;

    createGambler(username: string): Promise<Gambler>;

    getGambler(username: string): Promise<Gambler>;

    createBet(matchBet: MatchBet): Promise<MatchBet>;

    getBets(matchId: number): Promise<MatchBet[]>;

    getBets(username: string): Promise<MatchBet[]>;

    withdrawBet(matchBet: MatchBet): Promise<boolean>;
}

export class MockMatchApi implements MatchApi {
    private championships: Championship[] = [
        {
            id: 1,
            name: 'Ut99 1on1 iDM 2023',
            teams: ['Tonfish', 'Trops', 'Fen1x', 'Hex', 'Mclaud*', 'Best', 'WildCAT', 'Wrekahhh', 'FireyFly', 'VolariS', 'frőBácsi', 'Fiber', 'dMrL~', 'CrTz*']
        }
    ];
    private matches: Match[] = [
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
        }
    ];

    private matchBets: MatchBet[] = [];

    private gamblers: Gambler[] = [
        {
            username: 'vfiber',
            balance: 100,
            betCount: 0
        }
    ];

    async createChampionship(name: string): Promise<Championship> {
        const championship: Championship = {
            name
        };
        this.championships.push(championship);
        return championship;
    }

    async getMatch(matchId: string): Promise<Match | undefined> {
        return this.matches.find(match => match.id === Number(matchId));
    }

    async getMatches(championshipId: string): Promise<Match[]> {
        return this.matches.filter(match => match.championshipId === Number(championshipId));
    }

    async createMatch(match: Match): Promise<Match> {
        match.id = this.matches.length + 1;
        this.matches.push(match);
        return Promise.resolve(match);
    }

    async removeMatch(matchId: string): Promise<boolean> {
        const index = this.matches.findIndex(match => match.id === Number(matchId));
        if (index !== -1) {
            this.matches.splice(index, 1);
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    }

    async setMatchResult(match: Match): Promise<Match> {
        const index = this.matches.findIndex(m => m.id === match.id);
        this.matches[index] = match;
        return Promise.resolve(match);
    }

    async getGambler(username: string): Promise<Gambler> {
        return Promise.resolve({
            username,
            balance: 100,
            betCount: 0
        });
    }

    async createBet(matchBet: MatchBet): Promise<MatchBet> {
        this.matchBets.push(matchBet);
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

    async createGambler(username: string): Promise<Gambler> {
        const gambler: Gambler = {
            username,
            balance: 100,
            betCount: 0
        };
        this.gamblers.push(gambler);
        return Promise.resolve(gambler);
    }

    async getBets(param: string | number): Promise<MatchBet[]> {
        if (typeof param === 'string') {
            return this.matchBets.filter(bet => bet.username === String(param));
        }

        return this.matchBets.filter(bet => bet.matchId === Number(param));
    }
}
