module.exports = (sequelize, Sequelize) => {
  const Euclidean = sequelize.define("euclidean_rank", {
    id_patient: {
      type: Sequelize.INTEGER
    },
    worst_distance: {
      type: Sequelize.FLOAT
    },
    best_distance: {
      type: Sequelize.FLOAT
    },
    worst_similarity: {
      type: Sequelize.FLOAT
    },
    best_similarity: {
      type: Sequelize.FLOAT
    }
  });

  return Euclidean;
};