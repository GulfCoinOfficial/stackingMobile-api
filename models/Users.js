
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../databaseConnection/db');
class Users extends Model {}
Users.init(
  {
    firstName: {
      type: DataTypes.STRING,
      validate: {
        len: [1, 52],
        notNull: {
          msg: 'First Name can not be null',
        },
      },
      allowNull: false,
    },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 52],
          notNull: {
            msg: 'Last Name can not be null',
          },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: 'Email already exists.',
        },
        validate: {
            notNull: {
            msg: 'Email can not be null',
          },
          isEmail: {
            msg: 'Email is not valid',
          },
          len: [1, 50],
        },
      },
      password: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notNull: {
              msg: 'Password can not be null',
            },
            len: {
              args: [8],
              msg: 'Password must be atleast 8 characters long',
            },
          },
      },
      phoneNo: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      userName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isBlocked: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      timestamps: true,
      underscored: true
    },
    {
      sequelize,
      modelName: 'Users',
    }
);
module.exports = Users;