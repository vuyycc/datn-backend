
module.exports = (sequelize, Sequelize) => {
  const Patient = sequelize.define("patient", {
    name: {
      type: Sequelize.STRING
    },
    avatar_url: {
      type: Sequelize.STRING
    },
    gender: {
      type: Sequelize.INTEGER
    },
    white_blood_cell_count: {
      type: Sequelize.FLOAT
    },
    neutrophil_count: {
      type: Sequelize.FLOAT
    },
    lymphocyte_count: {
      type: Sequelize.FLOAT
    },
    haemoglobin: {
      type: Sequelize.FLOAT
    },
    blood_platelet_count: {
      type: Sequelize.FLOAT
    },
    albumin: {
      type: Sequelize.FLOAT
    },
    c_reactive_protein: {
      type: Sequelize.FLOAT
    },
    interleukin_6: {
      type: Sequelize.FLOAT
    },
    status: {
      type: Sequelize.INTEGER
    }
  });
  return Patient;
};