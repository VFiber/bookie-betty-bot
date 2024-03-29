import { AutocompleteInteraction, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

import { isWinnerType, MatchWithId, MessageFormatter, Winner } from '../bet';
// @ts-ignore
import {
    AutocompleteOption,
    botConfig,
    filterMatchesForAutoComplete,
    getBetApi,
    getWinnerAutocompleteForMatch,
    ParameterAutocompleteMap
} from '../bot';

const betApi = await getBetApi();

export const data = new SlashCommandBuilder()
    .setName('bet')
    .setDescription('Manages or displays matches.')
    .setDescription('Bets on a match')
    .addIntegerOption(option =>
        option.setName('match_id')
            .setAutocomplete(true)
            .setDescription('The match ID')
            .setRequired(true)
    )
    .addNumberOption(option =>
        option.setName('amount')
            .setDescription('The amount of the bet')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('winner')
            .setDescription('The winner team')
            .setRequired(true)
            .setAutocomplete(true)
    );

export const autocompleteMap: ParameterAutocompleteMap = {
    'winner': autocompleteBetWinner,
    'match_id': async (interaction: AutocompleteInteraction) => {
        const filterString = interaction.options.getFocused();
        let matches = await betApi.getMatches(botConfig.DEFAULT_CHAMPIONSHIP_ID, true);

        return filterMatchesForAutoComplete(matches, filterString);
    }
}

export async function execute(interaction: ChatInputCommandInteraction) {
    return await betMatch(interaction);
}

async function autocompleteBetWinner(interaction: AutocompleteInteraction): Promise<AutocompleteOption[]> {
    let matchId = interaction.options.getInteger('match_id', true);

    let match = await betApi.getMatch(matchId) as MatchWithId;
    return getWinnerAutocompleteForMatch(match);
}

async function betMatch(interaction: ChatInputCommandInteraction) {
    const match_id = interaction.options.getInteger('match_id', true);
    const bet_amount = interaction.options.getNumber('amount', true);
    const winner = interaction.options.getString('winner', true);

    const executedCommand = '/' + interaction.commandName + ' match_id:' + match_id + ' amount:' + bet_amount + ' winner:' + winner + "\n";

    if (!match_id || match_id < 0) {
        return await interaction.reply({
            content: executedCommand + "Nem található ilyen mérkőzés: #" + match_id,
            ephemeral: true
        });
    }

    if (!bet_amount || bet_amount < 1) {
        return await interaction.reply({
            content: executedCommand + `Azt a számmisztikát nem ismerem, ahol ${bet_amount} egy érvényes tét lenne.`,
            ephemeral: true
        });
    }

    if (!winner || !isWinnerType(winner)) {
        return await interaction.reply({
                content: executedCommand +
                    `A winner paraméter csak 'A' 'B' vagy 'DRAW' lehet, ezt nem értem: \`${winner}\` ` +
                    "\n Használd inkább a felugró automatikus kiegészítést, mint opciót.",
                ephemeral: true
            }
        );
    }

    // alapvető szintaktikai faszságok kiszűrve, jöhet az erősebb validáció
    await interaction.deferReply({ephemeral: true});

    const gambler = await betApi.getGambler(interaction.user) || await betApi.createGambler(interaction.user);

    if (!gambler) {
        return await interaction.editReply("Nem tom te ki vagy és nem tudlak felvenni, mint fogadó. Szólj a gazdámnak, mert valami gebasz van.");
    }

    if (!gambler.balance || gambler.balance < bet_amount) {
        return await interaction.editReply(`Egyenleged: $${gambler.balance}.- Nem tudsz $${bet_amount}.- téttel fogadni.`);
    }

    const match = await betApi.getMatch(match_id) as MatchWithId | undefined;

    if (!match) {
        return await interaction.editReply(executedCommand + "\n Nem található ilyen mérkőzés: #" + match_id);
    }

    if (match?.winner) {
        return await interaction.editReply({
            ...MessageFormatter.createMatchReply(match),
            content: executedCommand + "A mérkőzés már lezajlott. \n Úriember biztosra nem fogad. A többieknek meg tilos."
        });
    }

    if (match?.matchDateTime && match.matchDateTime < new Date()) {
        return await interaction.editReply({
            ...MessageFormatter.createMatchReply(match),
            content: executedCommand + "\n A mérkőzés már elkezdődött, nem fogadható. \n Ha már lezajlott, jelezd az adminnak, hogy rögzítse az eredményt!"
        });
    }

    if (match?.betLockDateTime && match.betLockDateTime < new Date()) {
        return await interaction.editReply({
            ...MessageFormatter.createMatchReply(match),
            content: executedCommand + "\n A mérkőzésre már nem fogadhatsz."
        });
    }

    const bet = await betApi.createBet({
        matchId: match_id,
        username: interaction.user.username,
        betDateTime: new Date(),
        amount: bet_amount,
        winner: winner as Winner
    });

    if (!bet) {
        return await interaction.editReply(executedCommand + "\n Belső hiba, nem tudtam létrehozni a fogadást. Szólj Fiber-nek, valami nem kerek.");
    }

    const bets = await betApi.getBets(match_id);

    const winnerString = winner === 'DRAW' ? 'Döntetlen' : "Győztes: " + (winner === 'A' ? match.teamA : match.teamB);
    const newBalance = await betApi.getGambler(interaction.user).then(gambler => gambler?.balance);
    const confirmContent = executedCommand +
        `## Sikeres fogadás - ${winnerString} - Összeg: $${bet_amount}.- \n` +
        `### Fogadás utáni egyenleged: $${newBalance}.-`;

    return await interaction.editReply({
            ...MessageFormatter.createMatchReply(match, bets),
            content: confirmContent
        }
    );
}
