"use strict";
process.env.NODE_ENV = "test";
const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "Software Developer",
    salary: 100000,
    equity: 0.075,
    companyHandle: "c3",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "Software Developer",
      salary: 100000,
      equity: "0.075",
      companyHandle: "c3",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle as "companyHandle"
           FROM jobs
           WHERE id = ${job.id}`
    );
    expect(result.rows).toEqual([
      {
        id: job.id,
        title: "Software Developer",
        salary: 100000,
        equity: "0.075",
        companyHandle: "c3",
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: 2,
        title: "designer",
        salary: 85000,
        equity: "0.05",
        companyHandle: "c2",
      },
      {
        id: 1,
        title: "photographer",
        salary: 65000,
        equity: "0",
        companyHandle: "c1",
      },
    ]);
  });
});
/*******************************************findAllWithQueryString */

describe("findAllWithQueryString", () => {
  test("works with title query", async () => {
    const data = { title: "designer" };
    let jobs = await Job.findAllWithQueryString(data);
    expect(jobs).toEqual([
      {
        id: 2,
        title: "designer",
        salary: 85000,
        equity: "0.05",
        companyHandle: "c2",
      },
    ]);
  });
  test("works with minSalary", async () => {
    const data = { minSalary: 80000 };
    let jobs = await Job.findAllWithQueryString(data);
    expect(jobs).toEqual([
      {
        id: 2,
        title: "designer",
        salary: 85000,
        equity: "0.05",
        companyHandle: "c2",
      },
    ]);
  });
  test("works with hasEquity", async () => {
    const data = { hasEquity: true };
    let jobs = await Job.findAllWithQueryString(data);
    expect(jobs).toEqual([
      {
        id: 2,
        title: "designer",
        salary: 85000,
        equity: "0.05",
        companyHandle: "c2",
      },
    ]);
  });
  test("works with multiple query parameters and partial titles", async () => {
    const data = { title: "des", minSalary: 70000, hasEquity: true };
    const jobs = await Job.findAllWithQueryString(data);
    expect(jobs).toEqual([
      {
        id: 2,
        title: "designer",
        salary: 85000,
        equity: "0.05",
        companyHandle: "c2",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(2);
    expect(job).toEqual({
      id: 2,
      title: "designer",
      salary: 85000,
      equity: "0.05",
      companyHandle: "c2",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(10000);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "janitor",
    salary: 40000,
    equity: 0.05,
  };

  test("works", async function () {
    let job = await Job.update(2, updateData);
    expect(job).toEqual({
      id: 2,
      title: "janitor",
      salary: 40000,
      equity: "0.05",
      companyHandle: "c2",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle as "companyHandle"
           FROM jobs
           WHERE id = 2`
    );
    expect(result.rows).toEqual([
      {
        id: 2,
        title: "janitor",
        salary: 40000,
        equity: "0.05",
        companyHandle: "c2",
      },
    ]);
  });

  test("works with only updating certain fields", async function () {
    const updateDataSetNulls = {
      title: "CEO",
      salary: 150000,
    };

    let job = await Job.update(2, updateDataSetNulls);
    expect(job).toEqual({
      id: 2,
      title: "CEO",
      salary: 150000,
      equity: "0.05",
      companyHandle: "c2",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle as "companyHandle"
           FROM jobs
           WHERE id = 2`
    );
    expect(result.rows).toEqual([
      {
        id: 2,
        title: "CEO",
        salary: 150000,
        equity: "0.05",
        companyHandle: "c2",
      },
    ]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(100000, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(2, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(2);
    const res = await db.query("SELECT id FROM jobs WHERE id = 2");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(100000);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/********************************* findAllJobsUserHasAppliedTo */

describe("findAllJobsUserHasAppliedTo", () => {
  test("works", async () => {
    const res = await Job.findAllJobsUserHasAppliedTo("u2");
    expect(res.length).toEqual(1);
    expect(res).toEqual([2]);
  });
  test("returns empty array if no jobs have been applied to", async () => {
    await db.query("DELETE FROM applications");
    const res = await Job.findAllJobsUserHasAppliedTo("u2");
    expect(res.length).toEqual(0);
    expect(res).toEqual([]);
  });
});
