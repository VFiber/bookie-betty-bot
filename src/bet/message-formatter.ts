import { ChampionshipWithId, Match, MatchBet, MatchWithBets, MatchWithId } from './api';
import { EmbedBuilder, quote } from 'discord.js';

export class MessageFormatter {
    static createShortEmbedFieldsFromMatch(championsship: ChampionshipWithId, match: Match | MatchWithBets, bets: MatchBet[] = []): {
        name: string,
        value: string,
        inline?: boolean
    }[] {
        const winnerString = match.winner === 'DRAW' ? 'Döntetlen' : `Győztes: ${match.winner === 'A' ? match.teamA : match.teamB}`;
        const result = 'Eredmény: ' + (match.winner ? `\n ${winnerString} ${match.resultA}:${match.resultB}` : ' - ');
        const betString = bets && Array.isArray(bets) && bets.length > 0 ? `${bets.length} fogadás, összesen: $${bets.reduce((acc: number, bet: MatchBet) => acc + bet.amount, 0)}` : '-';

        let rows = [];
        rows.push({
            name: `#${match.id} ${match.teamA} vs ${match.teamB}`,
            value: result,
            inline: true
        });

        rows.push({
            name: "Fogadások",
            value: betString,
            inline: true
        });

        let stateString = "-";

        if (!match.betLockDateTime && !match.matchDateTime) {
            stateString = "Fogadható";
        }

        if (match.betLockDateTime && match.betLockDateTime > new Date()) {
            stateString = `Még ${Math.floor((match.betLockDateTime.getTime() - new Date().getTime()) / 1000 / 60)} percig fogadható.`;
        }

        if ((match.betLockDateTime && match.betLockDateTime < new Date()) || (match.matchDateTime && match.matchDateTime < new Date())) {
            stateString = "Nem fogadható";
        }

        rows.push({
            name: `Állapot`,
            value: stateString,
            inline: true
        });

        return rows;
    }

    static createMatchReply(match: MatchWithId, bets: MatchBet[] = []) {

        const sumBetsForTeamA = bets.filter(bet => bet.winner === 'A').reduce((acc, bet) => acc + bet.amount, 0);
        const sumBetsForTeamB = bets.filter(bet => bet.winner === 'B').reduce((acc, bet) => acc + bet.amount, 0);
        const sumBetsForDraw = bets.filter(bet => bet.winner === 'DRAW').reduce((acc, bet) => acc + bet.amount, 0);

        const betCountForTeamA = bets.filter(bet => bet.winner === 'A').length;
        const betCountForTeamB = bets.filter(bet => bet.winner === 'B').length;
        const betCountForDraw = bets.filter(bet => bet.winner === 'DRAW').length;

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`#${match.id} ${match.teamA} vs ${match.teamB}`)
            .setTimestamp();

        let content = '';

        if (match.winner) {
            const winnerString = match.winner === 'DRAW' ? 'Döntetlen' : `Győztes: ${match.winner === 'A' ? match.teamA : match.teamB}`;
            embed.setFields({
                name: winnerString,
                value: `${match.teamA} vs ${match.teamB} - ${match.resultA}:${match.resultB}`
            });
        }

        if (bets.length > 0) {
            embed.addFields(
                {
                    name: "Fogadások",
                    value: `${bets.length} fogadás, összérték: ${bets.reduce((acc, bet) => acc + bet.amount, 0)}$`
                },
                {
                    name: `${match.teamA} győzelem`,
                    value: `${betCountForTeamA} fogadás, összesen: $${sumBetsForTeamA}.-`,
                    inline: true
                },
                {
                    name: `${match.teamB} győzelem`,
                    value: `${betCountForTeamB} fogadás, összesen: $${sumBetsForTeamB}.-`,
                    inline: true
                },
                {
                    name: `Döntetlen`,
                    value: `${betCountForDraw} fogadás, összesen: $${sumBetsForDraw}.-`,
                    inline: true
                }
            );
        } else {
            embed.addFields(
                {
                    name: "Fogadások",
                    value: "Nincs fogadás a mérkőzésre."
                }
            );
        }

        if (!match?.winner && (!match.betLockDateTime || match.betLockDateTime > new Date())) {
            if (match.betLockDateTime) {
                embed.addFields(
                    {
                        name: "Kérjük tegyék meg tétjeiket!",
                        value: `A fogadások lezárásáig még ${Math.floor((match.betLockDateTime.getTime() - new Date().getTime()) / 1000 / 60)} perc van hátra.`
                    }
                );
            } else {
                embed.addFields(
                    {
                        name: "Kérjük tegyék meg tétjeiket!",
                        value: 'A mérkőzésnek nincs megadva fogadási határideje, így a mérkőzés kezdetéig lehet fogadni'
                    }
                );
            }
            content += '\n### A fogadások lezárásáig\n' +
                quote(`/match bet match_id:${match.id}`) +
                `\n paranccsal lehet erre a mérkőzésre fogadni.\n`;

        } else {
            embed.addFields({
                    name: "Fogadások lezárva",
                    value: "A mérkőzésre nem lehet már fogadást kötni.",
                    inline: true
                },
                {
                    name: "Fogadások lezárásának időpontja",
                    value: match.betLockDateTime?.toLocaleString() || " - ",
                    inline: true
                },
                {
                    name: "Mérkőzés időpontja",
                    value: match.matchDateTime?.toLocaleString() || " - ",
                    inline: true
                }
            )
        }

        return {
            content: `Mérkőzés #${match.id}` + content,
            embeds: [embed]
        }
    }
}
