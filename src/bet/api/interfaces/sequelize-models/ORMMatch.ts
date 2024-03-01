import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import { ORMChampionship } from './ORMChampionship';
import { Match } from '../../models';

@Table({tableName: 'matches', paranoid: true})
export class ORMMatch extends Model<Match> {
    @ForeignKey(() => ORMChampionship)
    @Column({type: DataTypes.INTEGER})
    declare championshipId: number;

    @Column({type: DataTypes.STRING, allowNull: false})
    declare teamA: string;

    @Column({type: DataTypes.STRING, allowNull: false})
    declare teamB: string;

    @Column({type: DataTypes.TEXT})
    declare exludeBetAgainstTeamA?: string;

    @Column({type: DataTypes.TEXT})
    declare exludeBetAgainstTeamB?: string;

    @Column({type: DataTypes.DATE})
    declare matchDateTime?: Date;

    @Column({type: DataTypes.DATE})
    declare betLockDateTime?: Date;

    @Column({type: DataTypes.STRING})
    declare resultA?: number;
    @Column({type: DataTypes.STRING})
    declare resultB?: number;

    @Column({type: DataTypes.ENUM('A', 'B', 'DRAW')})
    declare winner?: string;
}
