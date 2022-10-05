
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../databaseConnection/db');
class otp extends Model { }
otp.init({
    user_id: {
      type: DataTypes.STRING,
      validate: {
        notNull: {
          msg: 'userId can not be null',
        },
      },
      allowNull: false,
    },
    code : {
        type: DataTypes.STRING,
    }
    },
    {
        sequelize,
        timestamps: true,
        underscored: true
      },
    {
      sequelize,
      modelName: 'otp',
    }
);
module.exports = otp;