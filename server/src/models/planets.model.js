const { parse } = require("csv-parse");
const path = require("path");
const fs = require("fs");

const planets = require("./planets.mongo");

const isHabitablePlanet = function (planet) {
  return (
    planet["koi_disposition"] === "CONFIRMED" &&
    planet["koi_insol"] > 0.36 &&
    planet["koi_insol"] < 1.1 &&
    planet["koi_prad"] < 1.6
  );
};
const loadPlanetsData = function () {
  return new Promise((resolve, reject) => {
    fs.createReadStream(
      path.join(__dirname, "..", "..", "data", "kepler_data.csv")
    )
      .pipe(
        parse({
          comment: "#",
          columns: true,
        })
      )
      .on("data", async (data) => {
        if (isHabitablePlanet(data)) {
          savePlanet(data);
        }
      })
      .on("error", (err) => {
        console.log(err);
        reject(err);
      })
      .on("end", async () => {
        const countPlanetsLength = (await getAllPlanets()).length;
        console.log(`${countPlanetsLength} habitable planets`);
        resolve();
      });
  });
};

const getAllPlanets = async function () {
  return await planets.find(
    {},
    {
      __v: 0,
      _id: 0,
    }
  );
};

const savePlanet = async function (planet) {
  try {
    await planets.updateOne(
      {
        keplerName: planet.kepler_name,
      },
      {
        keplerName: planet.kepler_name,
      },
      {
        upsert: true,
      }
    );
  } catch (err) {
    console.log(`We couldn't save our planet ${err}`);
  }
};

module.exports = {
  loadPlanetsData,
  getAllPlanets,
};
