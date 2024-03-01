import { Column, Model, Table } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

@Table({tableName: 'championships', paranoid: true})
export class ORMChampionship extends Model {
    @Column({type: DataTypes.STRING})
    declare name: string;

    @Column({type: DataTypes.STRING})
    declare teams: string;
}
