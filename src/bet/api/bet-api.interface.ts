import { ChampionshipWithId, Gambler, Match, MatchBet, MatchBetWithId, MatchWithId } from './models';
import { User } from 'discord.js';

export interface BetAPI {

    /**
     * Create a new championship with name & teams
     *
     * @param name
     * @param teams
     */
    createChampionship(name: string, teams: string[]): Promise<ChampionshipWithId | false>;

    updateChampionship(championship: ChampionshipWithId): Promise<ChampionshipWithId | false>;

    /**
     * Get a championship by id
     * @param championshipId
     */
    getChampionship(championshipId: number): Promise<ChampionshipWithId | undefined>;

    getChampionships(): Promise<ChampionshipWithId[]>;

    /**
     * Get all teams of a championship
     * @param championshipId
     */
    getTeams(championshipId: number): Promise<string[]>;

    /**
     * Get a match by id
     * @param matchId
     */
    getMatch(matchId: number | number[]): Promise<MatchWithId | MatchWithId[] | undefined>;

    /**
     * Get all matches of a championship
     * @param championshipId
     * @param openOnly
     */
    getMatches(championshipId: number, openOnly: boolean): Promise<MatchWithId[]>;

    /**
     * Get all locked matches of a championship
     * @param championshipId
     * @param withoutResultOnly
     */
    getLockedMatches(championshipId: number, withoutResultOnly: boolean): Promise<MatchWithId[]>;

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
    setMatchResult(match: MatchWithId): Promise<MatchWithId|false>;

    /**
     * Create a new user with a starting balance
     * @param username
     */
    createGambler(username: User): Promise<Gambler>;

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
    createBet(matchBet: MatchBet): Promise<MatchBet|false>;

    /**
     * Get all bets of a match
     * @param matchId
     */
    getBets(matchId: number | number[]): Promise<MatchBetWithId[]>;

    /**
     * Get all bets of a user
     * @param username
     */
    getBets(username: string): Promise<MatchBetWithId[]>;

    /**
     * Withdraw a bet
     * @param matchBet
     */
    withdrawBet(matchBet: MatchBet): Promise<boolean>;
}
