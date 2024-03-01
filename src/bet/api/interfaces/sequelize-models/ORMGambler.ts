import { Column, Model, Table } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import { Gambler } from '../../models';

@Table({tableName: 'gamblers', paranoid: true})
export class ORMGambler extends Model<Gambler, Gambler> {
    @Column({type: DataTypes.STRING, unique: true, primaryKey: true})
    declare id: string;

    @Column({type: DataTypes.INTEGER})
    declare accentColor: number | null | undefined

    @Column({type: DataTypes.STRING})
    declare avatarDecoration: string | null;

    @Column({type: DataTypes.STRING})
    declare banner: string | null | undefined;

    @Column({type: DataTypes.BOOLEAN})
    declare bot: boolean;

    @Column({type: DataTypes.BOOLEAN})
    declare system: boolean;

    @Column({type: DataTypes.STRING})
    declare discriminator: string;

    @Column({type: DataTypes.STRING, unique: true})
    declare username: string;

    @Column({type: DataTypes.STRING})
    declare globalName: string | null;

    @Column({type: DataTypes.DECIMAL(10, 4)})
    declare balance: number;

    @Column({type: DataTypes.INTEGER})
    declare betCount: number;
}
