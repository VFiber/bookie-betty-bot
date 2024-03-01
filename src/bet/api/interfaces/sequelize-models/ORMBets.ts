import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import { MatchBet, MatchBetWithId } from '../../models';
import { DataTypes } from 'sequelize';
import { ORMMatch } from './ORMMatch';

@Table({tableName: 'bets', paranoid: true})
export class ORMBets extends Model<MatchBetWithId, MatchBet> {
    @ForeignKey(() => ORMMatch)
    @Column({type: DataTypes.INTEGER})
    declare matchId: number;

    @Column({type: DataTypes.STRING})
    declare username: string;

    @Column({type: DataTypes.DATE})
    declare betDateTime: Date;

    @Column({type: DataTypes.DECIMAL(10, 2)})
    declare amount: number;

    @Column({type: DataTypes.ENUM('A', 'B', 'DRAW')})
    declare winner?: string;

    @Column({type: DataTypes.DECIMAL(10, 4), allowNull: true, defaultValue: null})
    declare earnings?: number;
}
