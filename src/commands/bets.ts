import { blockQuote, bold, ChatInputCommandInteraction, SlashCommandBuilder, underscore } from "discord.js";
import { getBetApi } from '../bot';
import { escapeFormatChars, MessageFormatter } from '../bet';

const betApi = await getBetApi();

export const data = new SlashCommandBuilder()
    .setName('bets')
    .setDescription('Shows your bets');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const bets = await betApi.getBets(interaction.user.username);

    if (bets.length === 0) {
        return await interaction.editReply('You have no bets.');
    }

    const matchIds = bets.map(bet => bet.matchId);
    const matches = await betApi.getMatch(matchIds);

    if (matches === undefined || !Array.isArray(matches)) {
        return await interaction.editReply('Weird, but no matches found for your bets.');
    }

    const userName = interaction.user.username;
    const gambler = await betApi.getGambler(userName);

    let reply = 'Megtett mérkőzéseid:\n';
    for (const bet of bets) {
        const match = matches.find(match => match.id === bet.matchId);

        if (!match) {
            console.error('Match not found for bet', bet);
            continue;
        }

        const winnerString = bet.winner === 'DRAW' ? 'Döntetlen' : "Győztes: " + escapeFormatChars((bet.winner === 'A' ? match.teamA : match.teamB));

        let matchString = underscore(escapeFormatChars(`#${match?.id} ${match?.teamA} vs ${match?.teamB}`)) + `, Összeg: $${bet.amount}, ` +
            `Fogadás: ${winnerString}`;

        if (bet.earnings) {
            matchString += bold(` | Eredmény: ${bet?.earnings > 0 ? 'Nyertél' : 'Vesztettél'} $${bet.earnings}`);
        }

        reply += matchString + '\n';
    }

    return await interaction.editReply(reply);
}

