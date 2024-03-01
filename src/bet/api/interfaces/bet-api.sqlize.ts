import { Sequelize } from 'sequelize-typescript';

import { BetAPI } from '../bet-api.interface';
import { ChampionshipWithId, Gambler, isWinnerType, Match, MatchBet, MatchBetWithId, MatchWithId } from '../models';
import { ORMChampionship, ORMMatch } from './sequelize-models';
import { Op } from 'sequelize';
import { ORMBets } from './sequelize-models/ORMBets';
import { ORMGambler } from './sequelize-models/ORMGambler';
import { User } from 'discord.js';
import { botConfig } from '../../../bot';

export class BetApiSqlize implements BetAPI {
    constructor(protected sqlize: Sequelize) {
    }

    async init(): Promise<BetApiSqlize> {
        this.sqlize.addModels([
            ORMChampionship,
            ORMMatch,
            ORMBets,
            ORMGambler
        ]);
        await this.sqlize.sync();
        return this;
    }

    async createChampionship(name: string, teams: string[]): Promise<ChampionshipWithId | false> {
        let championship;
        try {
            championship = await ORMChampionship.create({
                name,
                teams: teams.join(',')
            });
        } catch (error) {
            console.error('Error creating championship:', {
                name,
                teams,
                error
            });
            return false;
        }

        return {
            id: championship.id,
            name: championship.name,
            teams: championship.teams?.split(',')
        };
    }

    async getChampionship(championshipId: number): Promise<ChampionshipWithId | undefined> {
        const championship = await ORMChampionship.findByPk(championshipId);
        if (championship instanceof ORMChampionship) {
            return {
                id: championship.id,
                name: championship.name,
                teams: championship.teams?.split(',')
            };
        }

        return undefined;
    }

    async getTeams(championshipId: number): Promise<string[]> {
        const championship = await this.getChampionship(championshipId);
        if (!championship) {
            return [];
        }

        return championship?.teams || [];
    }

    async createMatch(match: Match): Promise<MatchWithId | false> {
        let ormMatch;
        try {
            ormMatch = await ORMMatch.create(match);
        } catch (error) {
            console.error('Error creating match:', {match, error});
            return false;
        }

        if (!ormMatch) {
            return false;
        }

        return ormMatch as MatchWithId;
    }

    async getMatch(matchId: number): Promise<MatchWithId | undefined> {
        const match = await ORMMatch.findByPk(matchId);
        if (match === null) {
            return undefined;
        }

        return this.mapMatch(match);
    }

    async getMatches(championshipId: number, openOnly: boolean): Promise<MatchWithId[]> {
        if (!openOnly) {
            return await ORMMatch.findAll({
                where: {
                    championshipId
                }
            }).then(matches => matches.map(match => this.mapMatch(match)));
        }

        return await ORMMatch.findAll({
            where: {
                [Op.and]: [
                    {championshipId: championshipId},
                    {
                        betLockDateTime: {
                            [Op.or]: {
                                [Op.gt]: new Date(),
                                [Op.eq]: null
                            }
                        }
                    }
                ]
            }
        }).then(matches => matches.map(match => this.mapMatch(match)));
    }

    async lockMatch(match_id: number, betLockDateTime: Date): Promise<MatchWithId | false> {
        await ORMBets.destroy({
            where: {
                matchId: match_id,
                createdAt: {
                    [Op.gt]: betLockDateTime
                }
            }
        });

        return ORMMatch.findByPk(match_id).then(match => {
            if (!match) {
                return false;
            }

            match.betLockDateTime = betLockDateTime;
            return match.save().then(match => this.mapMatch(match));
        });
    }

    removeMatch(matchId: number): Promise<boolean> {
        return ORMMatch.destroy({
            where: {
                id: matchId
            }
        }).then(affectedRows => affectedRows > 0);
    }

    async setMatchResult(updatedMatch: MatchWithId): Promise<MatchWithId | false> {
        const match = await ORMMatch.findByPk(updatedMatch.id);

        if (!match) {
            return false;
        }

        const matchBets = await ORMBets.findAll({
            where: {
                matchId: match.id
            }
        });

        let winnerBets = matchBets.filter(bet => bet.winner === updatedMatch.winner);

        // összeszámoljuk az összes fogadás összegét, ekkora összeget kell arányosan szétosztani a nyertesek között
        const totalBetAmount = matchBets.reduce((acc, bet) => acc + bet.amount, 0);
        // összeszámoljuk a nyertesek összegét
        const winnersAmount = winnerBets.reduce((acc, bet) => acc + bet.amount, 0);
        // az arányosan szétosztandó összeg
        const distributedAmount = totalBetAmount - winnersAmount;

        const transaction = await this.sqlize.transaction();

        try {
            await match.update(updatedMatch, {
                where: {
                    id: updatedMatch.id
                },
                transaction: transaction
            });

            winnerBets = await Promise.all(
                winnerBets.map(async (bet) => {
                    //TODO: bank itt lecsíphet %-ot, ha akar
                    const ratio = bet.amount / winnersAmount;
                    const earnings = distributedAmount * ratio + bet.amount;

                    const gambler = await ORMGambler.findOne({
                        where: {
                            username: bet.username
                        },
                        transaction: transaction
                    });
                    if (!gambler) {
                        throw new Error('Gambler not found');
                    }

                    gambler.balance += earnings;
                    gambler.betCount++;

                    await gambler.save({transaction});

                    bet.earnings = earnings;

                    await bet.save({transaction});

                    return bet;
                })
            );

            await Promise.all(
                matchBets.filter(bet => bet.winner !== updatedMatch.winner)
                    .map(async (bet) => {
                            bet.earnings = bet.amount * -1;
                            await bet.save({transaction});
                        }
                    )
            );

            await transaction.commit();
        } catch (error) {
            console.error('Error setting match result:', {updatedMatch, error});
            await transaction.rollback();
            return false;
        }

        return await this.getMatch(updatedMatch.id) || false;
    }

    addToGamblerBalance(username: string, amount: number): Promise<boolean> {
        return Promise.resolve(false);
    }

    async createBet(matchBet: MatchBet): Promise<MatchBet | false> {
        const gambler = await ORMGambler.findOne({
            where: {
                username: matchBet.username
            }
        });
        const transaction = await this.sqlize.transaction();
        let bet;
        try {
            bet = await ORMBets.create(matchBet, {transaction});
            gambler.balance -= matchBet.amount;
            gambler.betCount++;
            await gambler.save({transaction});
            await transaction.commit();
        } catch (error) {
            console.error('Error creating bet:', {matchBet, error});
            await transaction.rollback();
            return false;
        }

        return bet as unknown as MatchBet;
    }

    async createGambler(user: User): Promise<Gambler> {
        const gambler = await ORMGambler.create({
            ...user,
            balance: botConfig.DEFAULT_GAMBLING_AMOUNT,
            betCount: 0
        });

        return gambler as unknown as Gambler;
    }

    async getBets(param: number | number[] | string): Promise<MatchBetWithId[]> {
        if (typeof param === 'number' || Array.isArray(param)) {
            return ORMBets.findAll({
                where: {
                    matchId: param
                }
            }).then(bets => bets as unknown as MatchBetWithId[]);
        }

        return ORMBets.findAll({
            where: {
                username: param
            }
        }).then(bets => bets as unknown as MatchBetWithId[]);
    }

    async getGambler(username: string): Promise<Gambler> {
        const gambler = await ORMGambler.findOne({
            where: {
                username
            }
        });
        return gambler as unknown as Gambler;
    }

    withdrawBet(matchBet: MatchBet): Promise<boolean> {
        return Promise.resolve(false);
    }

    private mapMatch(match: ORMMatch): MatchWithId {
        return {
            championshipId: match.championshipId,
            id: match.id,
            teamA: match.teamA,
            teamB: match.teamB,
            exludeBetAgainstTeamA: match?.exludeBetAgainstTeamA?.split(','),
            exludeBetAgainstTeamB: match?.exludeBetAgainstTeamB?.split('?'),
            matchDateTime: match?.matchDateTime,
            betLockDateTime: match?.betLockDateTime,
            resultA: match?.resultA,
            resultB: match?.resultB,
            winner: isWinnerType(match?.winner) ? match.winner : undefined
        };
    }
}
