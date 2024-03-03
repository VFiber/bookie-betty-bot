import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

import { MessageFormatter } from '../bet';
import { getBetApi } from '../bot';

const betApi = await getBetApi();

export const data = new SlashCommandBuilder()
    .setName('match')
    .setDescription('Displays match details.')
    .setDescription('Grabs the match details, including bets & results if there is one.')
    .addIntegerOption(option =>
        option.setName('match_id')
            .setAutocomplete(true)
            .setDescription('The match ID')
            .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    return await showMatch(interaction);
}

async function showMatch(interaction: ChatInputCommandInteraction) {
    const match_id = interaction.options.getInteger('match_id', true);

    const match = await betApi.getMatch(match_id);

    if (!match) {
        const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle(`Nem található #${match_id} azonosítójú mérkőzés`)
            .setTimestamp();
        return await interaction.editReply({
            embeds: [embed]
        });
    }

    const bets = await betApi.getBets(match_id);

    return await interaction.editReply(MessageFormatter.createMatchReply(match, bets));
}
