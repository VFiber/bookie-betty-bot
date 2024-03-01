import { ChampionshipWithId, Gambler, Match, MatchBet, MatchBetWithId, MatchWithId } from './models';

export interface BetApi {

    /**
     * Create a new championship with name & teams
     *
     * @param name
     * @param teams
     */
    createChampionship(name: string, teams: string[]): Promise<ChampionshipWithId | false>;

    /**
     * Get a championship by id
     * @param championshipId
     */
    getChampionship(championshipId: number): Promise<ChampionshipWithId | undefined>;

    /**
     * Get all teams of a championship
     * @param championshipId
     */
    getTeams(championshipId: number): Promise<string[]>;

    /**
     * Get a match by id
     * @param matchId
     */
    getMatch(matchId: number): Promise<MatchWithId | undefined>;

    /**
     * Get all matches of a championship
     * @param championshipId
     * @param openOnly
     */
    getMatches(championshipId: number, openOnly: boolean): Promise<MatchWithId[]>;

    /**
     * Create a new match
     * @param match
     */
    createMatch(match: Match): Promise<MatchWithId | false>;

    /**
     * Lock a match for bets
     * @param match_id
     * @param betLockDateTime
     */
    lockMatch(match_id: number, betLockDateTime: Date): Promise<MatchWithId | false>;

    /**
     * Remove a match, if its not locked
     * @param matchId
     */
    removeMatch(matchId: number): Promise<boolean>;

    /**
     * Set the result of a match, distributes bets, etc.
     * @param match
     */
    setMatchResult(match: MatchWithId): Promise<MatchWithId>;

    /**
     * Create a new user with a starting balance
     * @param username
     */
    createGambler(username: string): Promise<Gambler>;

    /**
     * Get a user by username
     * @param username
     */
    getGambler(username: string): Promise<Gambler>;

    /**
     * Add an amount to a user's balance
     * @param username
     * @param amount
     */
    addToGamblerBalance(username: string, amount: number): Promise<boolean>

    /**
     * Create a new bet
     * @param matchBet
     */
    createBet(matchBet: MatchBet): Promise<MatchBet>;

    /**
     * Finalize a bet, set the earnings
     * @param bet_id
     * @param eranings
     */
    finalizeBet(bet_id: number, eranings: number): Promise<MatchBetWithId>

    /**
     * Get all bets of a match
     * @param matchId
     */
    getBets(matchId: number | number[]): Promise<MatchBet[]>;

    /**
     * Get all bets of a user
     * @param username
     */
    getBets(username: string): Promise<MatchBet[]>;

    /**
     * Withdraw a bet
     * @param matchBet
     */
    withdrawBet(matchBet: MatchBet): Promise<boolean>;
}
