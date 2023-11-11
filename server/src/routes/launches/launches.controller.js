const {
  getAllLaunches,
  scheduleNewLaunch,
  exitsLaunchWithId,
  abortLaunchById,
} = require("../../models/launches.model");
const { addNewLaunches } = require("../../models/launches.model");
const { getPagination } = require("../../services/query");

const httpGetAllLaunches = async function (req, res) {
  const { skip, limit } = getPagination(req.query);
  const launches = await getAllLaunches(skip, limit);
  return res.status(200).json(launches);
};

const httpAddNewLaunch = async function (req, res) {
  const launch = req.body;
  if (
    !launch.mission ||
    !launch.rocket ||
    !launch.launchDate ||
    !launch.target
  ) {
    return res.status(400).json({
      error: "Missing required Launch Property",
    });
  }
  launch.launchDate = new Date(launch.launchDate);
  if (isNaN(launch.launchDate)) {
    return res.status(400).json({ error: "Invalid Launch Date" });
  }

  await scheduleNewLaunch(launch);
  return res.status(201).json(launch);
};

const httpAbortLaunch = async function (req, res) {
  const launchId = +req.params.id;
  const exitsLaunch = await exitsLaunchWithId(launchId);

  if (!exitsLaunch) {
    return res.status(400).json({
      error: "Launch ID not Found",
    });
  }
  const aborted = await abortLaunchById(launchId);
  if (!aborted) {
    return res.status(400).json({
      error: "Launch not aborted",
    });
  }
  return res.status(200).json({
    ok: true,
  });
};

module.exports = {
  httpGetAllLaunches,
  httpAddNewLaunch,
  httpAbortLaunch,
};
