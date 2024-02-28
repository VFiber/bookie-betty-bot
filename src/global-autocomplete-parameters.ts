// TODO: mivel ugyanazokat a paramétereket használjuk mindenhol, így a név lehet típus és azokat kiszolgálhatja egy-egy globális Autocomplete object -> function map
import { AutocompleteInteraction } from 'discord.js';
import { AutocompleteOption, ParameterAutocompleteMap } from './bot-types';
import { betApi, BetApi } from './bet-api';

const api: BetApi = betApi;

async function matchIdAutocomplete(interaction: AutocompleteInteraction): Promise<AutocompleteOption[]> {
    const focusedValue = interaction.options.getFocused().toLowerCase();

    let matches = await api.getMatches(1, false);

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

/**
 * Azon paraméterek listája, amit a rendszer automatikusan fel tud ismerni névről, mert egyediek
 */
export const parameterAutocompleteMap: ParameterAutocompleteMap = {
    match_id: matchIdAutocomplete
}
