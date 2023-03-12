const dbConfig = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: 0,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.role = require("./Role.model.js")(sequelize, Sequelize);
db.user = require("./User.model.js")(sequelize, Sequelize);
db.patient = require("./Patient.model.js")(sequelize, Sequelize);
db.euclidean = require("./Euclidean.model.js")(sequelize, Sequelize);
db.manhattan = require("./Manhattan.model.js")(sequelize, Sequelize);

db.euclidean.belongsTo(db.patient, {
  foreignKey: "id_patient",
  as: "patient",
})
db.manhattan.belongsTo(db.patient, {
  foreignKey: "id_patient",
  as: "patient",
})

db.user.belongsTo(db.role, {
  foreignKey: "role",
  as: "role_user",
})

module.exports = db;