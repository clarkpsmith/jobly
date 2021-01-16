"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  isAdmin,
  isAdminOrOwnUser,
} = require("./auth");

const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const adminJwt = jwt.sign(
  { username: "test-admin", isAdmin: true },
  SECRET_KEY
);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");

describe("authenticateJWT", function () {
  test("works: via header", function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    expect.assertions(2);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});

describe("ensureLoggedIn", function () {
  test("works", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test", is_admin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureLoggedIn(req, res, next);
  });

  test("unauth if no login", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureLoggedIn(req, res, next);
  });
});

describe("test isAdmin Function", () => {
  test("test if isAdmin is True does not throw error", () => {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${adminJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    isAdmin(req, res, next);
  });

  test("test if isAdmin is false throws error", () => {
    expect.assertions(1);

    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = {
      locals: { user: { username: "test", is_admin: false } },
    };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    isAdmin(req, res, next);
  });
});

describe("test  isAdminOrOwnUser function", () => {
  test("does not throw error if user is admin", () => {
    expect.assertions(2);

    const req = {
      headers: { authorization: `Bearer ${adminJwt}` },
      params: { username: "test" },
    };

    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    isAdminOrOwnUser(req, res, next);
  });

  test("does not throw error if users own page", () => {
    expect.assertions(2);

    const req = {
      headers: { authorization: `Bearer ${testJwt}` },
      params: { username: "test" },
    };

    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    isAdminOrOwnUser(req, res, next);
  });
});
