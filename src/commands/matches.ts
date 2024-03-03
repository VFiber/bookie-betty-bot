import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { BetAPI, MatchWithBets, MessageFormatter } from '../bet';
import { botConfig, getBetApi } from '../bot';

const betApi = await getBetApi();

export const data = new SlashCommandBuilder()
    .setName('matches')
    .setDescription('Lists the active match list for the active championship')
    .addIntegerOption(option =>
        option.setName('championship_id')
            .setAutocomplete(true)
            .setDescription('Championship ID')
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const api: BetAPI = betApi;

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

    return await interaction.editReply({
        embeds: [MessageFormatter.createEmbedFromMatchList(championShip, matchesWithBets)]
    });
}
