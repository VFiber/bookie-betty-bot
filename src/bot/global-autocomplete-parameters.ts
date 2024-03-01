// TODO: mivel ugyanazokat a paramétereket használjuk mindenhol, így a név lehet típus és azokat kiszolgálhatja egy-egy globális Autocomplete object -> function map
import { AutocompleteInteraction } from 'discord.js';
import { AutocompleteOption, ParameterAutocompleteMap } from './bot-types';
import { BetApi, Match, MatchWithId } from '../bet';
import { betApi } from './environment-setup';
import { botConfig } from './botConfig';

const api: BetApi = betApi;

async function matchIdAutocomplete(interaction: AutocompleteInteraction): Promise<AutocompleteOption[]> {
    const filterString = interaction.options.getFocused().toLowerCase();
    let matches = await api.getMatches(botConfig.DEFAULT_CHAMPIONSHIP_ID, false);

    return filterMatchesForAutoComplete(matches, filterString);
}

/**
 * Azon paraméterek listája, amit a rendszer automatikusan fel tud ismerni névről, mert egyediek
 */
export const parameterAutocompleteMap: ParameterAutocompleteMap = {
    match_id: matchIdAutocomplete
}

export function filterMatches(matches: MatchWithId[], filterString = ""): MatchWithId[] {
    return matches.filter(
        (match) => {
            const stringMatchId = String(match.id);
            // teljes egyezés
            if (stringMatchId === filterString) {
                return true;
            }
            // eleje egyezik
            if (stringMatchId.startsWith(filterString)) {
                return true;
            }

            // bármely csapat első karaktereivel egyezik
            if (match.teamA.toLowerCase().startsWith(filterString)) {
                return true;
            }
            if (match.teamB.toLowerCase().startsWith(filterString)) {
                return true;
            }
        }
    )
}

export function filterMatchesForAutoComplete(matches: MatchWithId[], filterString: string): AutocompleteOption[] {
    if (filterString !== '') {
        matches = filterMatches(matches, filterString);
    }

    return matches.map(match => (
            {
                name: `#${match.id} - ${match.teamA} vs ${match.teamB}`,
                value: match.id
            }
        )
    );
}

export function getWinnerAutocompleteForMatch(match: Match | undefined): AutocompleteOption[] {
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
