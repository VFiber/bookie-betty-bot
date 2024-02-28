import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { betApi, BetApi } from '../bet-api';
import { MessageFormatter } from '../message-formatter';
import { AutocompleteOption, ParameterAutocompleteMap } from '../bot-types';
import { config } from '../config';

const api: BetApi = betApi;

export const data = new SlashCommandBuilder()
    .setName('matchadmin')
    .setDescription('Manages or displays matches.')
    .addSubcommand(subcommand =>
        subcommand.setName('create')
            .setDescription('Creates a new match')
            .addStringOption(option =>
                option.setName('team_a')
                    .setDescription('The first team')
                    .setAutocomplete(true)
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('team_b')
                    .setDescription('The second team')
                    .setAutocomplete(true)
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand.setName('delete')
            .setDescription('Deletes a match')
            .addIntegerOption(option =>
                option.setName('match_id')
                    .setAutocomplete(true)
                    .setDescription('The match ID')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand.setName('lock')
            .setDescription('Locks a match for a given timestamp / effective immediately')
            .addIntegerOption(option =>
                option.setName('match_id')
                    .setAutocomplete(true)
                    .setDescription('The match ID')
                    .setRequired(true)
            ).addStringOption(option =>
            option.setName('timestamp')
                .setDescription('The timestamp in format: (Y-m-dTh:i:s) 2024-01-01T12:00. If not given, the current time is used.')
                .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
        subcommand.setName('result')
            .setDescription('Sets the result of a match')
            .addIntegerOption(option =>
                option.setName('match_id')
                    .setAutocomplete(true)
                    .setDescription('The match ID')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('winner')
                    .setDescription('The winner team')
                    .setRequired(true)
                    .addChoices(
                        {name: 'Team A', value: 'A'},
                        {name: 'Team B', value: 'B'},
                        {name: 'Döntetlen', value: 'DRAW'}
                    )
            )
            .addIntegerOption(option =>
                option.setName('result_a')
                    .setDescription('The result of team A')
            )
            .addIntegerOption(option =>
                option.setName('result_b')
                    .setDescription('The result of team B')
            )
    )
    .addSubcommand(subcommand =>
        subcommand.setName('set_default_championship')
            .setDescription('Sets the default championship')
            .addIntegerOption(option =>
                option.setName('championship_id')
                    .setDescription('The championship ID')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand.setName('get_default_championship')
            .setDescription('Gets the default championship id.')
    );

export const autocompleteMap: ParameterAutocompleteMap = {
    'team_a': autocomplete_teams,
    'team_b': autocomplete_teams
}

export async function execute(interaction: ChatInputCommandInteraction) {
    console.log(interaction.options.getSubcommand(), interaction.options);

    await interaction.deferReply();

    switch (interaction.options.getSubcommand()) {
        case 'create':
            return await createMatch(interaction);
        case 'delete':
            return await deleteMatch(interaction);
        case 'lock':
            return await lockMatch(interaction);
        case 'result':
            return await setMatchResult(interaction);
        case 'set_default_championship':
            config.DEFAULT_CHAMPIONSHIP_ID = interaction.options.getInteger('championship_id', true);
            return await interaction.editReply("Default championship set to: " + config.DEFAULT_CHAMPIONSHIP_ID);
        case 'get_default_championship':
            return await interaction.editReply("Default championship is: " + config.DEFAULT_CHAMPIONSHIP_ID);
        default:
            return await interaction.editReply("Nem található ilyen parancs");
    }
}

async function autocomplete_teams(interaction: AutocompleteInteraction): Promise<AutocompleteOption[]> {
    console.log("Autocomplete teams", interaction.options);
    let teams = await api.getTeams(1);

    const focused = interaction.options.getFocused(true);

    const otherTeamParam = focused.name === 'team_a' ? 'team_b' : 'team_a';

    const otherTeam = interaction.options.getString(otherTeamParam);

    if (otherTeam) {
        teams = teams.filter(team => team !== otherTeam);
    }

    if (focused && focused.value) {
        teams = teams.filter(team =>
            team === focused.value ||
            team.startsWith(focused.value)
        );
    }

    return teams.map(teamName => ({
        name: teamName,
        value: teamName
    }));
}

async function createMatch(interaction: ChatInputCommandInteraction) {
    const teamA = interaction.options.getString('team_a');
    const teamB = interaction.options.getString('team_b');

    let executedCommand = `/matchadmin create team_a:${teamA} team_b:${teamB} \n`;

    if (!teamA || !teamB) {
        return await interaction.editReply(executedCommand + "Hiányzó csapatnév:" + (teamA ? " team_b" : " team_a"));
    }

    const allowedTeams = await api.getTeams(1);

    const teamAFound = allowedTeams.includes(teamA);
    const teamBFound = allowedTeams.includes(teamB);

    if (!teamAFound || !teamBFound) {
        if (!teamAFound && !teamBFound) {
            executedCommand += `Team A: ${teamA} és Team B: ${teamB} nem található a bajnkoságban. `;
        } else if (!teamAFound) {
            executedCommand += `Team A: ${teamA} nem található a bajnkoságban. `;
        } else if (!teamBFound) {
            executedCommand += `Team B: ${teamB} nem található a bajnkoságban. `;
        }

        return await interaction.editReply(executedCommand);
    }

    const match = await api.createMatch({
        championshipId: 1,
        teamA,
        teamB
    });

    if (!match) {
        return await interaction.editReply(executedCommand + "\nHiba történt a mérkőzés létrehozása közben.");
    }

    return await interaction.editReply(MessageFormatter.createMatchReply(match));
}

async function deleteMatch(interaction: ChatInputCommandInteraction) {
    return await interaction.editReply(interaction.commandName + ' ' + interaction.options.getSubcommand() + " még nincs, de ezt küldted: " + JSON.stringify(interaction.options));
}

async function lockMatch(interaction: ChatInputCommandInteraction) {
    return await interaction.editReply(interaction.commandName + ' ' + interaction.options.getSubcommand() + " még nincs, de ezt küldted: " + JSON.stringify(interaction.options));
}

async function setMatchResult(interaction: ChatInputCommandInteraction) {
    return await interaction.editReply(interaction.commandName + ' ' + interaction.options.getSubcommand() + " még nincs, de ezt küldted: " + JSON.stringify(interaction.options));
}
