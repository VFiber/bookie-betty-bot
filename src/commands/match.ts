import { AutocompleteInteraction, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

import { betApi, BetApi, isWinnerType, Winner } from '../bet-api';
import { MessageFormatter } from '../message-formatter';
import { AutocompleteOption, ParameterAutocompleteMap } from '../bot-types';

const api: BetApi = betApi;

export const data = new SlashCommandBuilder()
    .setName('match')
    .setDescription('Manages or displays matches.')
    .addSubcommand(subcommand =>
        subcommand.setName('show')
            .setDescription('Grabs the match details, including bets & results if there is one.')
            .addIntegerOption(option =>
                option.setName('match_id')
                    .setAutocomplete(true)
                    .setDescription('The match ID')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand.setName('bet')
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
            )
    );

export const autocompleteMap: ParameterAutocompleteMap = {
    'winner': autocompleteBetWinner,
    'match_id': autcompleteMatchId
}

export async function execute(interaction: ChatInputCommandInteraction) {
    switch (interaction.options.getSubcommand()) {
        case 'show':
            await interaction.deferReply();
            return await showMatch(interaction);
        case 'bet':
            return await betMatch(interaction);
        default:
            return await interaction.editReply("Nem található ilyen parancs");
    }
}

async function autcompleteMatchId(interaction: AutocompleteInteraction): Promise<AutocompleteOption[] | false> {
    if (interaction.options.getSubcommand() !== 'bet') {
        return false;
    }

    const focusedValue = interaction.options.getFocused();

    let matches = await api.getMatches(1, true);

    if (focusedValue !== '') {
        matches = matches.filter(
            (match) => {
                const stringMatchId = String(match.id);
                // teljes egyezés
                if (stringMatchId === focusedValue) {
                    return true;
                }
                // eleje egyezik
                if (stringMatchId.startsWith(focusedValue)) {
                    return true;
                }

                // bármely csapat első karaktereivel egyezik
                if (match.teamA.toLowerCase().startsWith(focusedValue)) {
                    return true;
                }
                if (match.teamB.toLowerCase().startsWith(focusedValue)) {
                    return true;
                }
            }
        );
    }

    return matches.map(match => (
            {
                name: `#${match.id} - ${match.teamA} vs ${match.teamB}`,
                value: match.id
            }
        )
    );
}

async function autocompleteBetWinner(interaction: AutocompleteInteraction): Promise<AutocompleteOption[]> {
    let matchId = interaction.options.getInteger('match_id', true);

    let match = await api.getMatch(matchId);

    if (!match) {
        return [
            {
                name: "Team A",
                value: "A"
            },
            {
                name: "Team B",
                value: "B"
            },
            {
                name: "Döntetlen",
                value: "DRAW"
            }
        ];
    }

    return [
        {
            name: match.teamA,
            value: "A"
        },
        {
            name: match.teamB,
            value: "B"
        },
        {
            name: "Döntetlen",
            value: "DRAW"
        }
    ];
}

async function betMatch(interaction: ChatInputCommandInteraction) {
    const match_id = interaction.options.getInteger('match_id', true);
    const bet_amount = interaction.options.getNumber('amount', true);
    const winner = interaction.options.getString('winner', true);

    const executedCommand = '/' + interaction.commandName + ' ' + interaction.options.getSubcommand() + ' match_id:' + match_id + ' amount:' + bet_amount + ' winner:' + winner + "\n";

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

    const gambler = await api.getGambler(interaction.user.username);

    if (!gambler) {
        return await interaction.editReply("Nem tom te ki vagy és nem tudlak felvenni, mint fogadó. Szólj a gazdámnak, mert valami gebasz van.");
    }

    if (!gambler.balance || gambler.balance < bet_amount) {
        return await interaction.editReply(`Egyenleged: $${gambler.balance}.- Nem tudsz $${bet_amount}.- téttel fogadni.`);
    }

    const match = await api.getMatch(match_id);

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

    const bet = await api.createBet({
        matchId: match_id,
        username: interaction.user.username,
        betDateTime: new Date(),
        amount: bet_amount,
        winner: winner as Winner
    });

    if (!bet) {
        return await interaction.editReply(executedCommand + "\n Belső hiba, nem tudtam létrehozni a fogadást. Szólj Fiber-nek, valami nem kerek.");
    }

    const bets = await api.getBets(match_id);

    const winnerString = winner === 'DRAW' ? 'Döntetlen' : "Győztes: " + (winner === 'A' ? match.teamA : match.teamB);
    const newBalance = await api.getGambler(interaction.user.username).then(gambler => gambler?.balance);
    const confirmContent = executedCommand +
        `## Sikeres fogadás - ${winnerString} - Összeg: $${bet_amount}.- \n` +
        `### Fogadás utáni egyenleged: $${newBalance}.-`;

    return await interaction.editReply({
            ...MessageFormatter.createMatchReply(match, bets),
            content: confirmContent
        }
    );
}

async function showMatch(interaction: ChatInputCommandInteraction) {
    const match_id = interaction.options.getInteger('match_id', true);

    const match = await api.getMatch(match_id);

    if (!match) {
        const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle(`Nem található #${match_id} azonosítójú mérkőzés`)
            .setTimestamp();
        return await interaction.editReply({
            embeds: [embed]
        });
    }

    const bets = await api.getBets(match_id);

    return await interaction.editReply(MessageFormatter.createMatchReply(match, bets));
}
