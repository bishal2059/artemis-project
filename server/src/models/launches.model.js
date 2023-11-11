const axios = require("axios");

const launches = require("./launches.mongo");
const planets = require("./planets.mongo");

const DEFAULT_FLIGHT_NUMBER = 100;

const SPACEX_API_URL = "https://api.spacexdata.com/v4/launches/query";

// const launch = {
//   flightNumber: 100, //fight_number
//   mission: "Kepler Exploration X", //name
//   rocket: "Explorer IS1", //rocket.name
//   launchDate: new Date("December 27,2030"), //date_local
//   target: "Kepler-442 b",
//   customers: ["NASA", "SpaceX"], //payload.customers
//   upcoming: true, //upcoming
//   success: true, //success
// };

async function findLaunch(launch) {
  return await launches.findOne(launch);
}

async function exitsLaunchWithId(launchID) {
  return await findLaunch({ flightNumber: launchID });
}

async function getAllLaunches(skip, limit) {
  return await launches
    .find({}, { _id: 0, __v: 0 })
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
}

async function populateLaunches() {
  console.log("downloading launch data...");
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    console.log("Problem downloading launch data");
    throw new Error("Launch data download failed");
  }

  const launchDocs = response.data.docs;
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc["payloads"];
    const customers = payloads.flatMap((payload) => {
      return payload["customers"];
    });

    const launch = {
      flightNumber: launchDoc["flight_number"],
      mission: launchDoc["name"],
      rocket: launchDoc["rocket"]["name"],
      launchDate: launchDoc["date_local"],
      upcoming: launchDoc["upcoming"],
      success: launchDoc["success"],
      customers,
    };
    console.log(`${launch.flightNumber} ${launch.mission}`);

    await saveLaunch(launch);
  }
}

async function loadLaunchData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });

  if (firstLaunch) {
    console.log("Launch data already loaded");
  } else {
    await populateLaunches();
  }
}

async function saveLaunch(launch) {
  return await launches.findOneAndUpdate(
    { flightNumber: launch.flightNumber },
    launch,
    { upsert: true }
  );
}
// (async function () {
//   try {
//     await saveLaunch(launch);
//   } catch (err) {
//     console.error(err);
//   }
// })();

async function getLatestFlightNumber() {
  const latestLaunch = await launches.findOne().sort("-flightNumber");

  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }
  return latestLaunch.flightNumber;
}

async function scheduleNewLaunch(launch) {
  const planet = await planets.findOne({
    keplerName: launch.target,
  });
  if (!planet) {
    throw new Error("Matching Planet isn't found");
  }
  const lastestFlightNumber = (await getLatestFlightNumber()) + 1;
  const newLaunch = Object.assign(launch, {
    customers: ["NASA", "SpaceX"],
    upcoming: true,
    success: true,
    flightNumber: lastestFlightNumber,
  });
  await saveLaunch(newLaunch);
}

async function abortLaunchById(launchID) {
  const aborted = await launches.updateOne(
    {
      flightNumber: launchID,
    },
    {
      upcoming: false,
      success: false,
    }
  );
  return aborted.matchedCount === 1 && aborted.modifiedCount === 1;
}

module.exports = {
  loadLaunchData,
  exitsLaunchWithId,
  scheduleNewLaunch,
  getAllLaunches,
  abortLaunchById,
};
