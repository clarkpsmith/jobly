"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
  const newJob = {
    title: "Developer",
    salary: 90000,
    equity: 0.5,
    companyHandle: "c2",
  };

  test("ok for admins", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: 3,
        title: "Developer",
        salary: 90000,
        equity: "0.5",
        companyHandle: "c2",
      },
    });
  });

  test("throws unauthorized error for nonadmins", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("throws unauthorized if not logged in", async function () {
    const resp = await request(app).post("/jobs").send(newJob);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        salary: 10000,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: 100000,
        salary: "90000",
        equity: 0.5,
        companyHandle: "c2",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: 2,
          title: "designer",
          salary: 150000,
          equity: "0.1",
          companyHandle: "c3",
        },
        {
          id: 1,
          title: "photographer",
          salary: 65000,
          equity: "0.05",
          companyHandle: "c1",
        },
      ],
    });
  });
  test("test get jobs with one query params", async function () {
    const resp = await request(app).get("/jobs?title=phot");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: 1,
          title: "photographer",
          salary: 65000,
          equity: "0.05",
          companyHandle: "c1",
        },
      ],
    });
  });

  test("test get jobs with multiple query params ", async function () {
    const resp = await request(app).get("/jobs?title=desig&minSalary=60000");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: 2,
          title: "designer",
          salary: 150000,
          equity: "0.1",
          companyHandle: "c3",
        },
      ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/1`);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: "photographer",
        salary: 65000,
        equity: "0.05",
        companyHandle: "c1",
      },
    });
  });

  //   test("works for anon: company w/o jobs", async function () {
  //     const resp = await request(app).get(`/companies/c3`);
  //     expect(resp.body).toEqual({
  //       company: {
  //         handle: "c3",
  //         name: "C3",
  //         description: "Desc3",
  //         numEmployees: 3,
  //         logoUrl: "http://c3.img",
  //         jobs: [],
  //       },
  //     });
  //   });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/1000`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: "artist",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: "artist",
        salary: 65000,
        equity: "0.05",
        companyHandle: "c1",
      },
    });
  });

  test("un auth for users", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: "artist",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).patch(`/jobs/1`).send({
      title: "artist",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/1000`)
      .send({
        title: "artist",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        id: 1000,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        salary: "10000",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
      .delete(`/jobs/1`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: "1" });
  });

  test("unauth for users", async function () {
    const resp = await request(app)
      .delete(`/jobs/2`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).delete(`/jobs/1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
      .delete(`/jobs/10000`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
