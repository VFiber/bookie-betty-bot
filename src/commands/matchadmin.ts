import { AutocompleteInteraction, ChatInputCommandInteraction, codeBlock, SlashCommandBuilder } from "discord.js";
import { BetApi, isWinnerType, MessageFormatter, Winner } from '../bet';
import {
    AutocompleteOption,
    betApi,
    botConfig,
    filterMatchesForAutoComplete,
    getWinnerAutocompleteForMatch,
    ParameterAutocompleteMap
} from '../bot';

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
            .setDescription('Closes the match bets, removes every bets placed after this time.')
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
                    .setAutocomplete(true)
            )
            .addIntegerOption(option =>
                option.setName('result_team_a')
                    .setRequired(true)
                    .setDescription('The result of team A (score/map score)')
            )
            .addIntegerOption(option =>
                option.setName('result_team_b')
                    .setRequired(true)
                    .setDescription('The result of team B (score/map score)')
            )
            .addStringOption(option =>
                option.setName('match_datetime')
                    .setDescription('The date and time of the match in format: (Y-m-dTh:i:s) 2024-01-01T12:00')
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
    'team_b': autocomplete_teams,
    'match_id': resultMatchIdAutocomplete,
    'winner': autcompleteWinner
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
            botConfig.DEFAULT_CHAMPIONSHIP_ID = interaction.options.getInteger('championship_id', true);
            return await interaction.editReply("Default championship set to: " + botConfig.DEFAULT_CHAMPIONSHIP_ID);
        case 'get_default_championship':
            return await interaction.editReply("Default championship is: " + botConfig.DEFAULT_CHAMPIONSHIP_ID);
        default:
            return await interaction.editReply("Nem található ilyen parancs");
    }
}

async function resultMatchIdAutocomplete(interaction: AutocompleteInteraction): Promise<AutocompleteOption[] | false> {
    if (interaction.options.getSubcommand() !== 'result') {
        return false;
    }

    const filterString = interaction.options.getFocused();
    let matches = await api.getMatches(botConfig.DEFAULT_CHAMPIONSHIP_ID, true);

    return filterMatchesForAutoComplete(matches, filterString);
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

async function autcompleteWinner(interaction: AutocompleteInteraction): Promise<AutocompleteOption[]> {
    let matchId = interaction.options.getInteger('match_id', true);
    let match = await api.getMatch(matchId);
    return getWinnerAutocompleteForMatch(match);
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
    const match_id = interaction.options.getInteger('match_id', true);
    const match = await api.getMatch(match_id);

    if (!match) {
        return await interaction.editReply("Nem található ilyen mérkőzés: #" + match_id);
    }

    if (match?.winner) {
        return await interaction.editReply("A mérkőzés eredménye már be van állítva, nem törölhető.");
    }

    const deleted = await api.removeMatch(match.id);

    if (!deleted) {
        return await interaction.editReply("Hiba történt a mérkőzés törlése közben.");
    }

    return await interaction.editReply("Mérkőzés törölve: #" + match.id + " - " + match.teamA + " vs " + match.teamB);
}

async function lockMatch(interaction: ChatInputCommandInteraction) {
    const match_id = interaction.options.getInteger('match_id', true);
    const match = await api.getMatch(match_id);
    const timestamp_string = interaction.options.getString('timestamp');
    const timestamp = timestamp_string ? new Date(timestamp_string) : new Date();

    if (isNaN(timestamp.getTime())) {
        return await interaction.editReply("Helytelen dátum formátum: " + timestamp_string + " . Aktuális idő formátuma: " + new Date().toISOString());
    }

    if (!match) {
        return await interaction.editReply("Nem található ilyen mérkőzés: #" + match_id);
    }

    if (match?.winner) {
        return await interaction.editReply({
            ...MessageFormatter.createMatchReply(match),
            content: "### A mérkőzés már le van zárva, nem zárolható újra."
        });
    }

    if (match?.matchDateTime && timestamp > match.matchDateTime) {
        return await interaction.editReply("A mérkőzés kezdési időpontja után nem lehet a mérkőzést zárolni.");
    }

    const updatedMatch = await api.lockMatch(match.id, timestamp);

    if (!updatedMatch) {
        return await interaction.editReply("Hiba történt a mérkőzés zárolása közben.");
    }

    const bets = await api.getBets(match_id);

    return await interaction.editReply({
        ...MessageFormatter.createMatchReply(updatedMatch, bets),
        content: "### A mérkőzés utolsó fogadási időpontja: " + updatedMatch.betLockDateTime?.toLocaleString()
    });
}

async function setMatchResult(interaction: ChatInputCommandInteraction) {
    const dateTimeString = interaction.options.getString('match_datetime') || '';
    const matchDateTime = dateTimeString ? new Date(dateTimeString) : new Date();

    const match_id = interaction.options.getInteger('match_id', true);
    const match = await api.getMatch(match_id);

    let executedCommand = `/matchadmin result match_id:${interaction.options.getInteger('match_id', true)} winner:${interaction.options.getString('winner', true)} result_team_a:${interaction.options.getInteger('result_team_a', true)} result_team_b:${interaction.options.getInteger('result_team_b', true)} match_datetime:${dateTimeString || ''} \n`;

    if (isNaN(matchDateTime.getTime())) {
        return await interaction.editReply(executedCommand + "Helytelen dátum formátum: " + dateTimeString + " . Aktuális idő formátuma: " + new Date().toISOString());
    }

    if (!match) {
        return await interaction.editReply(executedCommand + "Nem található ilyen mérkőzés: #" + match_id);
    }

    if (match?.winner) {
        return await interaction.editReply({
            ...MessageFormatter.createMatchReply(match),
            content: executedCommand + "### A mérkőzés már lezajlott, utólag nem módosítható."
        });
    }

    // lockolva van-e már a meccs, ha nincs, azt is be kell állítani

    const resultA = interaction.options.getInteger('result_team_a', true);
    const resultB = interaction.options.getInteger('result_team_b', true);
    const winner = interaction.options.getString('winner', true) as Winner;

    if (!isWinnerType(winner)) {
        return await interaction.editReply(executedCommand + "Helytelen győztes formátum: " + winner + " . Lehetőséges értékek: A, B, DRAW");
    }

    // FIXME: tranzakció kezdete

    const updatedMatch = await api.setMatchResult({
        ...match,
        resultA: resultA,
        resultB: resultB,
        winner: winner,
        matchDateTime: matchDateTime
    });

    // FIXME: tranzakció vége
    if (!updatedMatch) {
        return await interaction.editReply(executedCommand + "Hiba történt a mérkőzés eredményének beállítása közben.");
    }

    let content = executedCommand + "## A mérkőzés eredménye: " + updatedMatch.teamA + " vs " + updatedMatch.teamB + " - " + updatedMatch.resultA + ":" + updatedMatch.resultB + " - " + (updatedMatch.winner === 'DRAW' ? 'Döntetlen' : `Győztes: ${updatedMatch.winner === 'A' ? updatedMatch.teamA : updatedMatch.teamB}`);

    const bets = await api.getBets(match_id);

    console.log(bets);

    if (bets.length > 0) {
        const winnersAndAmounts = bets.filter(bet => bet?.earnings && bet.earnings > 0).map(bet => `@${bet.username}: $+${bet.earnings}`).join(', ');
        const loosersAndAmounts = bets.filter(bet => bet?.earnings && bet.earnings < 0).map(bet => `@${bet.username}: $${bet.earnings}`).join(', ');
        content += `\n### Fogadások: ${bets.length} fogadás, összérték: ${bets.reduce((acc, bet) => acc + bet.amount, 0)}$ \n` +
            codeBlock(`Nyertesek: ${winnersAndAmounts} \n`) +
            codeBlock(`Vesztesek: ${loosersAndAmounts}`);
    }

    let finalizeReply = {
        ...MessageFormatter.createMatchReply(updatedMatch, bets),
        content
    };

    return await interaction.editReply(finalizeReply);
}
