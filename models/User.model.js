module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("user", {
    avatar_url: {
      type: Sequelize.STRING
    },
    email: {
      type: Sequelize.STRING
    },
    name: {
      type: Sequelize.STRING
    },
    password: {
      type: Sequelize.STRING
    },
    sex: {
      type: Sequelize.INTEGER
    },
    birthday: {
      type: Sequelize.STRING
    },
    role: {
      type: Sequelize.INTEGER
    },
    status: {
      type: Sequelize.INTEGER
    }
  });

  return User;
};