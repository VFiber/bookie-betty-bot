import { botConfig } from './botConfig';
import { BetAPI, BetApiSeqelize } from '../bet';
import { MockBetApi } from '../bet';
import { Sequelize } from 'sequelize-typescript';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const modelPath = __dirname + '/../bet/api/interfaces/sequelize-models/*.ts';

async function getBetApiInstance(): Promise<BetAPI> {
    switch (botConfig.PERSISTENCE_TYPE) {
        case 'SQL':
            if (botConfig.SQLITE_FILE) {

                const sqlize = new Sequelize({
                    dialect: 'sqlite',
                    storage: botConfig.SQLITE_FILE
                });

                try {
                    await sqlize.authenticate();
                } catch (error) {
                    console.error(`Unable to connect to the SQLite database "${botConfig.SQLITE_FILE}":`, error);
                }

                return await (new BetApiSeqelize(sqlize)).init();

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

let betApi: BetAPI;

export async function getBetApi() {
    if (betApi) {
        return betApi;
    }
    betApi = await getBetApiInstance();
    return betApi;
}
