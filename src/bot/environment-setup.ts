import { botConfig } from './botConfig';
import { BetApi } from '../bet';
import { MockBetApi } from '../bet';


function getBetApiInstance() {
    switch (botConfig.PERSISTENCE_TYPE) {
        case 'SQL':
            if (botConfig.SQLITE_FILE) {
                // TODO: setup sqlite
                return new MockBetApi();
            } else if (botConfig.SQL_HOST && botConfig.SQL_PORT && botConfig.SQL_USER && botConfig.SQL_PASSWORD && botConfig.SQL_DATABASE) {
                // TODO: setup sql
                return new MockBetApi();
            } else {
                throw new Error("Missing environment variables for SQL persistence: SQLITE_FILE or SQL_HOST, SQL_PORT, SQL_USER, SQL_PASSWORD, SQL_DATABASE");
            }
            break;
        default:
            console.warn("Using memory & mock, no PESISITENCE_TYPE set, ");
            return new MockBetApi();
    }
}

export const betApi: BetApi = getBetApiInstance();
