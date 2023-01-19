
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../databaseConnection/db');
class UnstackingReqest extends Model {}
UnstackingReqest.init(
    {
        user_id : {
            type : DataTypes.INTEGER,
            allowNull : false
        },
        key: {
            type: DataTypes.STRING,
            allowNull: false
        },
        approved: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
    },
    {
        sequelize,
        timestamps: true,
        underscored: true
    },
    {
        sequelize,
        modelName: 'UnstackingReqest',
    }
);
module.exports = UnstackingReqest;
