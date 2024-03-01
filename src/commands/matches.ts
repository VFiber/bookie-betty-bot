import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

import { BetApi, MatchWithBets, MessageFormatter } from '../bet';
import { betApi, botConfig } from '../bot';

export const data = new SlashCommandBuilder()
    .setName('matches')
    .setDescription('Lists the active match list for the active championship')
    .addIntegerOption(option =>
        option.setName('championship_id')
            .setDescription('Championship ID')
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const api: BetApi = betApi;

    const championshipId = interaction.options.getInteger('championship_id') || botConfig.DEFAULT_CHAMPIONSHIP_ID;
    const championShip = await api.getChampionship(championshipId);

    if (!championShip) {
        return await interaction.editReply(`Championship #${championshipId} not found`);
    }

    let matches = await api.getMatches(championshipId, false);
    let matchIds = matches.map(match => match.id);
    let bets = await api.getBets(matchIds as number[]);

    let matchesWithBets: MatchWithBets[] = matches.map(
        (match) => {
            if (!match.id) {
                return {
                    ...match,
                    bets: []
                };
            }

            return {
                ...match,
                bets: bets.filter(bet => bet.matchId === match.id)
            };
        }
    );


    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle("Mérkőzések")
        .setDescription(championShip.name + " mérkőzései");

    matchesWithBets.forEach((match: MatchWithBets) => {
        embed.addFields(MessageFormatter.createShortEmbedFieldsFromMatch(championShip, match, match.bets));
    });

    embed.setTimestamp();

    return await interaction.editReply({
        embeds: [embed]
    });
}
