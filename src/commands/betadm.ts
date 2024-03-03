import { AutocompleteInteraction, ChatInputCommandInteraction, codeBlock, SlashCommandBuilder } from "discord.js";
import { isWinnerType, MatchWithId, MessageFormatter, Winner } from '../bet';
import {
    AutocompleteOption,
    botConfig,
    filterMatchesForAutoComplete, getBetApi,
    getWinnerAutocompleteForMatch,
    ParameterAutocompleteMap
} from '../bot';

const betApi = await getBetApi();

export const data = new SlashCommandBuilder()
    .setName('betadm')
    .setDescription('Manages or displays matches.')
    .addSubcommandGroup(subcommand =>
        subcommand.setName('championship')
            .setDescription('Displays the current championship')
            .addSubcommand(subcommand =>
                subcommand.setName('create')
                    .setDescription('Creates a new championship')
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('The name of the championship')
                            .setRequired(true)
                    )
                    .addStringOption(option =>
                        option.setName('teams')
                            .setDescription('The teams in the championship, separated by comma. eg: "Team One,Team Two,Team Three"')
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand.setName('add_teams')
                    .setDescription('Adds a team to the [default] championship')
                    .addIntegerOption(option =>
                        option.setName('championship_id')
                            .setDescription('The championship ID')
                            .setAutocomplete(true)
                            .setRequired(true)
                    )
                    .addStringOption(option =>
                        option.setName('teams')
                            .setDescription('The team names separated by comma. eg: "Team One,Team Two,Team Three"')
                            .setRequired(true)
                    )
            )

            .addSubcommand(subcommand =>
                subcommand.setName('remove_teams')
                    .setDescription('Remove a team to the [default] championship')
                    .addIntegerOption(option =>
                        option.setName('championship_id')
                            .setDescription('The championship ID')
                            .setAutocomplete(true)
                            .setRequired(true)
                    )
                    .addStringOption(option =>
                        option.setName('teams')
                            .setDescription('The team names separated by comma. eg: "Team One,Team Two,Team Three"')
                            .setAutocomplete(true)
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand.setName('set_default')
                    .setDescription('Sets the default championship')
                    .addIntegerOption(option =>
                        option.setName('championship_id')
                            .setAutocomplete(true)
                            .setDescription('The championship ID')
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand.setName('get_default')
                    .setDescription('Gets the default championship id.')
            )
    ).addSubcommandGroup(
        subcommand => subcommand.setName('match')
            .setDescription('Manages matches')
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
    )

export const autocompleteMap: ParameterAutocompleteMap = {
    'team_a': autocomplete_team,
    'team_b': autocomplete_team,
    'teams': autocomplete_team,
    'match_id': resultMatchIdAutocomplete,
    'winner': autcompleteWinner
}

export async function execute(interaction: ChatInputCommandInteraction) {
    console.log(interaction.options.getSubcommand(), interaction.options);

    await interaction.deferReply();

    if (interaction.options.getSubcommandGroup() === 'championship') {
        switch (interaction.options.getSubcommand()) {
            case 'create':
                return await createChampionship(interaction);
            case 'add_teams':
                return await addTeamsToChampionship(interaction);
            case 'remove_teams':
                return await removeTeamsFromChampionship(interaction);
            case 'set_default':
                botConfig.DEFAULT_CHAMPIONSHIP_ID = interaction.options.getInteger('championship_id', true);
                return await interaction.editReply("Default championship set to: " + botConfig.DEFAULT_CHAMPIONSHIP_ID);
            case 'get_default':
                return await interaction.editReply("Default championship is: " + botConfig.DEFAULT_CHAMPIONSHIP_ID);
        }
    } else if (interaction.options.getSubcommandGroup() === 'match') {

        switch (interaction.options.getSubcommand()) {
            case 'create':
                return await createMatch(interaction);
            case 'delete':
                return await deleteMatch(interaction);
            case 'lock':
                return await lockMatch(interaction);
            case 'result':
                return await setMatchResult(interaction);
            default:
                return await interaction.editReply("Nem található ilyen parancs");
        }
    }

    return await interaction.editReply("Nem található ilyen parancs");
}

async function resultMatchIdAutocomplete(interaction: AutocompleteInteraction): Promise<AutocompleteOption[] | false> {
    const subcommand = interaction.options.getSubcommand();
    if (!['result', 'lock'].includes(subcommand)) {
        return false;
    }

    const filterString = interaction.options.getFocused();

    let matches: MatchWithId[];

    if (subcommand === 'lock') {
        matches = await betApi.getMatches(botConfig.DEFAULT_CHAMPIONSHIP_ID, true);
    } else {
        //result
        matches = await betApi.getLockedMatches(botConfig.DEFAULT_CHAMPIONSHIP_ID, true);
    }

    return filterMatchesForAutoComplete(matches, filterString);
}

async function autocomplete_team(interaction: AutocompleteInteraction): Promise<AutocompleteOption[]> {
    // ha van championship_id, akkor adminnak kell a 'teams' paraméter, nem biztos, hogy a default kell
    const givenChampionshipId = interaction.options.getInteger('championship_id');
    const championship_id = givenChampionshipId ? givenChampionshipId : botConfig.DEFAULT_CHAMPIONSHIP_ID;

    let teams = await betApi.getTeams(championship_id);

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
    let match = await betApi.getMatch(matchId) as MatchWithId | undefined;
    return getWinnerAutocompleteForMatch(match);
}

async function createChampionship(interaction: ChatInputCommandInteraction) {
    const name = interaction.options.getString('name', true);
    const teams = interaction.options.getString('teams', true);

    const teamList = teams.split(',').map(team => team.trim());

    const championship = await betApi.createChampionship(name, teamList);

    if (!championship) {
        return await interaction.editReply("Hiba történt a bajnokság létrehozása közben.");
    }

    const reply = MessageFormatter.createChampionshipReply(championship)

    return await interaction.editReply(
        {
            content: "Bajnokság létrehozva: \n" + reply
        }
    );
}

async function addTeamsToChampionship(interaction: ChatInputCommandInteraction) {
    const teams = interaction.options.getString('teams', true);
    const championshipId = interaction.options.getInteger('championship_id', true);
    const teamList = teams.split(',').map(team => team.trim()).filter(team => team.length > 0);

    const championship = await betApi.getChampionship(championshipId);

    if (!championship) {
        return await interaction.editReply("Nincs ilyen bajnokság.");
    }
    if (!championship.teams) {
        championship.teams = [];
    }

    championship.teams = [
        ...championship.teams,
        ...teamList
    ];

    const updatedChampionship = await betApi.updateChampionship(championship);

    if (!updatedChampionship) {
        return await interaction.editReply("Hiba történt a csapatok hozzáadása közben.");
    }

    const reply = MessageFormatter.createChampionshipReply(updatedChampionship)

    return await interaction.editReply(
        {
            content: "Csapatok hozzáadva: \n" + reply
        }
    );
}

async function removeTeamsFromChampionship(interaction: ChatInputCommandInteraction) {
    const teams = interaction.options.getString('teams', true);
    const championshipId = interaction.options.getInteger('championship_id', true);
    const teamsToRemove = teams.split(',').map(team => team.trim());

    const championship = await betApi.getChampionship(championshipId);

    if (!championship) {
        return await interaction.editReply("Nincs ilyen bajnokság.");
    }
    if (!championship.teams) {
        championship.teams = [];
    }

    championship.teams = championship.teams.filter(team => !teamsToRemove.includes(team));

    const updatedChampionship = await betApi.updateChampionship(championship);

    if (!updatedChampionship) {
        return await interaction.editReply("Hiba történt a csapatok eltávolítása közben.");
    }

    const reply = MessageFormatter.createChampionshipReply(updatedChampionship)

    return await interaction.editReply(
        {
            content: "Csapatok eltávolítva: \n" + reply
        }
    );

}

async function createMatch(interaction: ChatInputCommandInteraction) {
    const teamA = interaction.options.getString('team_a');
    const teamB = interaction.options.getString('team_b');

    let executedCommand = `/betadm create team_a:${teamA} team_b:${teamB} \n`;

    if (!teamA || !teamB) {
        return await interaction.editReply(executedCommand + "Hiányzó csapatnév:" + (teamA ? " team_b" : " team_a"));
    }

    const allowedTeams = await betApi.getTeams(botConfig.DEFAULT_CHAMPIONSHIP_ID);

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

    const match = await betApi.createMatch({
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
    const match = await betApi.getMatch(match_id) as MatchWithId | undefined;

    if (!match) {
        return await interaction.editReply("Nem található ilyen mérkőzés: #" + match_id);
    }

    if (match?.winner) {
        return await interaction.editReply("A mérkőzés eredménye már be van állítva, nem törölhető.");
    }

    const deleted = await betApi.removeMatch(match.id);

    if (!deleted) {
        return await interaction.editReply("Hiba történt a mérkőzés törlése közben.");
    }

    return await interaction.editReply("Mérkőzés törölve: #" + match.id + " - " + match.teamA + " vs " + match.teamB);
}

async function lockMatch(interaction: ChatInputCommandInteraction) {
    const match_id = interaction.options.getInteger('match_id', true);
    const match = await betApi.getMatch(match_id) as MatchWithId | undefined;
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

    const updatedMatch = await betApi.lockMatch(match.id, timestamp);

    if (!updatedMatch) {
        return await interaction.editReply("Hiba történt a mérkőzés zárolása közben.");
    }

    const bets = await betApi.getBets(match_id);

    return await interaction.editReply({
        ...MessageFormatter.createMatchReply(updatedMatch, bets),
        content: "### A mérkőzés utolsó fogadási időpontja: " + updatedMatch.betLockDateTime?.toLocaleString()
    });
}

async function setMatchResult(interaction: ChatInputCommandInteraction) {
    const dateTimeString = interaction.options.getString('match_datetime') || '';
    const matchDateTime = dateTimeString ? new Date(dateTimeString) : new Date();

    const match_id = interaction.options.getInteger('match_id', true);
    let match = await betApi.getMatch(match_id) as MatchWithId | undefined;

    let executedCommand = `/betadm result match_id:${interaction.options.getInteger('match_id', true)} winner:${interaction.options.getString('winner', true)} result_team_a:${interaction.options.getInteger('result_team_a', true)} result_team_b:${interaction.options.getInteger('result_team_b', true)} match_datetime:${dateTimeString || ''} \n`;

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

    if (!match.betLockDateTime) {
        const lockedMatch = await betApi.lockMatch(match.id, matchDateTime);
        if (!lockedMatch) {
            return await interaction.editReply(executedCommand + "Hiba történt a mérkőzés zárolása közben.");
        }

        match.betLockDateTime = lockedMatch.betLockDateTime;
    }

    // lockolva van-e már a meccs, ha nincs, azt is be kell állítani

    const resultA = interaction.options.getInteger('result_team_a', true);
    const resultB = interaction.options.getInteger('result_team_b', true);
    const winner = interaction.options.getString('winner', true) as Winner;

    if (!isWinnerType(winner)) {
        return await interaction.editReply(executedCommand + "Helytelen győztes formátum: " + winner + " . Lehetőséges értékek: A, B, DRAW");
    }

    const updatedMatch = await betApi.setMatchResult({
        ...match,
        resultA: resultA,
        resultB: resultB,
        winner: winner,
        matchDateTime: matchDateTime
    });

    if (!updatedMatch) {
        return await interaction.editReply(executedCommand + "Hiba történt a mérkőzés eredményének beállítása közben.");
    }

    let content = executedCommand + "## A mérkőzés eredménye: " + updatedMatch.teamA + " vs " + updatedMatch.teamB + " - " + updatedMatch.resultA + ":" + updatedMatch.resultB + " - " + (updatedMatch.winner === 'DRAW' ? 'Döntetlen' : `Győztes: ${updatedMatch.winner === 'A' ? updatedMatch.teamA : updatedMatch.teamB}`);

    const bets = await betApi.getBets(match_id);

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
