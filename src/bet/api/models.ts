
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
    id?: number;
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
    earnings?: number;
}

export interface MatchBetWithId extends Omit<MatchBet, 'id'> {
    id: number;
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
