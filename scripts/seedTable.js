const mongoose = require("mongoose");
const Table = require("../models/Table");
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log("Connected to MongoDB!");
    seedTables();
  })
  .catch(err => {
    console.error("Error connecting to MongoDB:", err);
  });

const seedTables = async () => {
  try {

    await Table.deleteMany();


    const tables = [];


    let isTakeawayAdded = false;
    

    for (let i = 1; i <= 20; i++) {
      const isTakeaway = !isTakeawayAdded && Math.random() > 0.95;
      if (isTakeaway) isTakeawayAdded = true;

      tables.push({
        tableNumber: i,
        seats: Math.floor(Math.random() * 4) + 2,
        location: isTakeaway ? "Outdoor" : ["Indoor", "Outdoor"][Math.floor(Math.random() * 2)],
        status: "available",
        isTakeaway: isTakeaway,
      });
    }


    tables.sort((a, b) => b.isTakeaway - a.isTakeaway);


    await Table.insertMany(tables);

    console.log("Successfully seeded 20 tables!");
    mongoose.disconnect();
  } catch (error) {
    console.error("Error seeding tables:", error);
    mongoose.disconnect();
  }
};
