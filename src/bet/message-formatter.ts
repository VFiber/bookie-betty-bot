import { ChampionshipWithId, LeaderboardEntry, MatchBet, MatchWithBets, MatchWithId } from './api';
import { codeBlock, EmbedBuilder, quote } from 'discord.js';
import { AlignmentEnum, AsciiTable3 } from 'ascii-table3';

export class MessageFormatter {
    static createMatchTable(championship: ChampionshipWithId, matches: MatchWithBets[], page = 0): string {
        const renderedFullTable: string = codeBlock(MessageFormatter.getMatchTable(matches, championship));
        const fullTableStringlength = renderedFullTable.length;

        if (fullTableStringlength <= 2000) {
            return renderedFullTable;
        }

        // hagyunk a lapozás állapotának kiíratására 400 karakter bizonytalansági tényezőként (mérkőzésenként eltérhet a hossz)
        let minPageCount = Math.ceil(fullTableStringlength / 1800);

        if (page && page <= minPageCount) {
            // biztosan lesz lapozás, mert már a usertől úgy jött
            return MessageFormatter.createMatchTablePaginated(championship, matches, page, minPageCount);
        }

        // több lapra kell törni, de nem jött lap paraméter
        page = 1;
        return MessageFormatter.createMatchTablePaginated(championship, matches, page, minPageCount);
    }

    static createMatchTablePaginated(championship: ChampionshipWithId, matches: MatchWithBets[], page: number, pageCount: number): string {
        // a matches tömböt szét kell vágni pageCount darabra, ezért megszámoljuk hány meccs van benne
        const matchCount = matches.length;
        const matchesPerPage = Math.ceil(matchCount / pageCount);

        const startIndex = (page - 1) * matchesPerPage;
        const slicedMatches = matches.slice(startIndex, startIndex + matchesPerPage);

        const commandInfo = `/matches championship_id:${championship.id} page:${page + 1}`;
        const pageInfo = `Oldal: ${page}/${pageCount} | Összesen: ${matchCount} mérkőzés.`;
        return codeBlock(MessageFormatter.getMatchTable(slicedMatches, championship, page, pageCount) + pageInfo + '\n' + commandInfo);
    }

    private static getMatchTable(matches: MatchWithBets[], championship: ChampionshipWithId, currentpage: number = 0, maxPages: number = 0): string {

        function getMatchBetStateSring(match: MatchWithBets) {
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
            return stateString;
        }

        function getWinnerString(match: MatchWithBets) {
            if (!match.winner) {
                return ' - ';
            }

            return match.winner === 'DRAW' ? 'Döntetlen' : `${match.winner === 'A' ? match.teamA : match.teamB}`;
        }

        function getScoreString(match: MatchWithBets) {
            return match.winner ? `${match.resultA}:${match.resultB}` : ' - ';
        }

        const matrix = matches.map((match: MatchWithBets) => [
            match.id,
            match.teamA + ' vs ' + match.teamB,
            getScoreString(match),
            getWinnerString(match),
            match?.bets ? match.bets.length + ' db - $' + match.bets.reduce((acc, bet) => acc + bet.amount, 0) : 0,
            getMatchBetStateSring(match)
        ]);

        const title = `#${championship.id} - ${championship.name}` + (maxPages > 0 ? ` - ${currentpage}/${maxPages}` : '');
        const table =
            new AsciiTable3(title)
                .setHeading('ID', 'Mérkőzés', 'Eredmény', 'Győztes', 'Fogadások', 'Állapot')
                .addRowMatrix(matrix);

        return table.toString();
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

    static createChampionshipReply(championship: ChampionshipWithId) {
        return `### Bajnokság: \#${championship.id} - ${championship.name} `
            + (championship.teams ? `bajnokságban résztvevő csapatok: ${championship?.teams.join(', ')}` : 'Nincs résztvevő csapat.');
    }

    static createChampionshipListReply(championships: ChampionshipWithId[]) {
        let content = '';

        championships.forEach((championship: ChampionshipWithId) => {
                content += MessageFormatter.createChampionshipReply(championship) + '\n';
            }
        );

        return content;
    }

    static createLeaderboard(gamblers: LeaderboardEntry[]) {
        const matrix = gamblers.map((gambler: LeaderboardEntry, index) => {
                const earnings = gambler?.sumEarnings ? gambler?.sumEarnings?.toFixed(2) + "$" : 0;
                return [index + 1 + ".", `${gambler.globalName} (${gambler.username})`, earnings, gambler.betCount]
            }
        );

        const table = new AsciiTable3('Hazárdírozók hall of fame')
            .setHeading('#', 'Játékos', 'Kereset', 'Fogadások száma')
            .setAlign(3, AlignmentEnum.RIGHT)
            .setAlign(4, AlignmentEnum.CENTER)
            .addRowMatrix(matrix)
            .setStyle('unicode-round');

        return table.toString();
    }
}
