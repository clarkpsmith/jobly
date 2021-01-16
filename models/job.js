"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForQueryStrings } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const duplicateCheck = await db.query(
      `SELECT title, company_handle as companyHandle
           FROM jobs
           WHERE title = $1 AND salary = $2 AND equity = $3 AND company_handle = $4`,
      [title, salary, equity, companyHandle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: ${title} at ${companyHandle}`);

    const result = await db.query(
      `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle as "companyHandle"`,
      [title, salary, equity, companyHandle]
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */
  static async findAll() {
    const jobsRes = await db.query(`SELECT id, title, salary, equity, company_handle as "companyHandle"
               
           FROM jobs ORDER BY title`);
    return jobsRes.rows;
  }

  /** search with filtering via query string
   *
 Returns [{ id, title, salary, equity, companyHandle  }, ...]
  */
  static async findAllWithQueryString(data) {
    //if querystring is empty  run regular findAll class method
    if (Object.keys(data).length === 0) {
      return this.findAll();
    }
    const { conditionals, values } = sqlForQueryStrings(data, {
      minSalary: "salary",
      hasEquity: "equity",
    });
    const querySql = `SELECT id, title, salary, equity, company_handle as "companyHandle"
               
           FROM jobs WHERE ${conditionals} ORDER BY title`;
    const jobsRes = await db.query(querySql, [...values]);
    return jobsRes.rows;
  }

  /***** finds all jobs a user has applied returns a string of job ids [job_id, job_id ] */
  static async findAllJobsUserHasAppliedTo(username) {
    const res = await db.query(
      `SELECT job_id FROM applications WHERE username = $1`,
      [username]
    );

    const ids = res.rows.map((job) => job.job_id);
    console.log(ids);
    return ids;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id, title, salary, equity, company_handle as "companyHandle"
               
           FROM jobs WHERE id = $1`,
      [id]
    );

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const jsToSql = { companyHandle: "company_handle" };
    const { setCols, values } = sqlForPartialUpdate(data, jsToSql);
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No company: ${id}`);

    return job;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No Job: ${id}`);
  }
}

module.exports = Job;
