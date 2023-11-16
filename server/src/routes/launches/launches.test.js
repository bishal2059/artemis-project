const request = require("supertest");
const app = require("../../app");
const { mongoConnect, mongoDisconnect } = require("../../services/mongo");
const { loadPlanetsData } = require("../../models/planets.model");

describe("Launches API", () => {
  beforeAll(async () => {
    await mongoConnect();
    await loadPlanetsData();
  });

  describe("Test GET/launches", () => {
    test("It should respond 200 success", async () => {
      const response = await request(app)
        .get("/v1/launches")
        .expect(200)
        .expect("Content-Type", /json/);
      // expect(response.statusCode).toBe(200);
    });
  });
  describe("Test POST/launches", () => {
    const completelaunchData = {
      mission: "USS Enterprise",
      rocket: "NCC 1701-D",
      target: "Kepler-62 f",
      launchDate: "January 4,2028",
    };
    const launchDataWithInvalidDate = {
      mission: "USS Enterprise",
      rocket: "NCC 1701-D",
      target: "Kepler-62 f",
      launchDate: "zoot",
    };
    const launchDataWithoutDate = {
      mission: "USS Enterprise",
      rocket: "NCC 1701-D",
      target: "Kepler-62 f",
    };
    test("It should response with 201 created", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(completelaunchData)
        .expect(201)
        .expect("Content-Type", /json/);

      const requestDate = new Date(completelaunchData.launchDate).valueOf();
      const responseDate = new Date(response.body.launchDate).valueOf();

      expect(responseDate).toBe(requestDate);
      expect(response.body).toMatchObject(launchDataWithoutDate);
    });
    test("It should catch missing required properties", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(launchDataWithoutDate)
        .expect(400)
        .expect("Content-Type", /json/);
      expect(response.body).toStrictEqual({
        error: "Missing required Launch Property",
      });
    });
    test("It should catch invalid dates", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(launchDataWithInvalidDate)
        .expect(400)
        .expect("Content-Type", /json/);
      expect(response.body).toStrictEqual({
        error: "Invalid Launch Date",
      });
    });
  });

  afterAll(async () => {
    await mongoDisconnect();
  });
});
