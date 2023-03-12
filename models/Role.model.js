module.exports = (sequelize, Sequelize) => {
  const Role = sequelize.define("role", {
    name_role: {
      type: Sequelize.STRING
    },
    description: {
      type: Sequelize.STRING
    }
  });

  return Role;
};