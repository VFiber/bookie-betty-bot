import { bold, ChatInputCommandInteraction, SlashCommandBuilder, underscore } from "discord.js";
import { getBetApi } from '../bot';
import { escapeFormatChars } from '../bet';

const betApi = await getBetApi();

export const data = new SlashCommandBuilder()
    .setName('bets')
    .setDescription('Shows your bets');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ephemeral: true});

    let bets = await betApi.getBets(interaction.user.username);

    if (bets.length === 0) {
        return await interaction.editReply('You have no bets.');
    }

    // bets = bets.reverse();

    const matchIds = bets.map(bet => bet.matchId);
    const matches = await betApi.getMatch(matchIds);

    if (matches === undefined || !Array.isArray(matches)) {
        return await interaction.editReply('Weird, but no matches found for your bets.');
    }

    const openBets = bets.filter(bet => !bet.earnings).length;
    const closedBets = bets.length - openBets;

    let betList: string = '';

    const headerString = bets.length + "  db megtett mérkőzés, ebből " + openBets + " db még nyitott és " + closedBets + " db már lezárult fogadás.\n";

    for (const bet of bets) {
        const match = matches.find(match => match.id === bet.matchId);

        if (!match) {
            console.error('Match not found for bet', bet);
            continue;
        }

        const winnerString = bet.winner === 'DRAW' ? 'Döntetlen' : "Győztes: " + escapeFormatChars((bet.winner === 'A' ? match.teamA : match.teamB));

        let matchString = escapeFormatChars(`#${match?.id} ${match?.teamA} vs ${match?.teamB}`) + ` | ` +
            underscore("Fogadás:")+` ${winnerString} - ${bet.amount} $`;

        if (bet.earnings) {
            matchString += " | Eredmény: " + bold(`${bet?.earnings > 0 ? 'Nyertél' : 'Vesztettél'} ${bet.earnings - bet.amount} $`);
        }

        betList += bet.betDateTime.toISOString().split("T")[0] + " - " + matchString + '\n';
    }

    let reply = headerString + betList;
    console.log(reply.length);
    const maxReplyLength = 2000;

    if (reply.length > maxReplyLength) {
        // Discord has a 2000 character limit for messages
        // split the matchlist by linebreaks and apply back until the length is less than 2000 in reverse order (showing the most recent bets first)
        const betListArray = betList.split('\n');
        let pagedBetList = headerString + "Legutóbbi fogadásaid:";
        while(pagedBetList.length + betListArray[betListArray.length - 1].length < maxReplyLength) {
            pagedBetList += betListArray.pop() + "\n";
        }
        reply = pagedBetList;
    }

    return await interaction.editReply(reply);
}

