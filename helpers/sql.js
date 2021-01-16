const { BadRequestError } = require("../expressError");

/*pass in a data object to be updated for dataToUpdate
 jsToSql is an already set object depending on its use that contains the sql naming conventions keynames and the corresponding javascript camelcase conventions and keynames
*/
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/* creates sql conditonal string from query string data
converts min and max values to numbers from strings
adds % sign before and after value to allow search for any name that includes said value
jsToSql is an already set object depending on its use that contains the sql naming conventions keynames and the corresponding javascript camelcase conventions and keynames
*/
function sqlForQueryStrings(dataObj, jsToSql) {
  const keys = Object.keys(dataObj);
  const values = Object.values(dataObj);
  let conditionals = keys.map((key, i) => {
    if (key === "name" || key === "title") {
      values[i] = `%${values[i]}%`;
      return `${key} ILIKE $${i + 1}`;
    }
    if (key === "minEmployees" || key === "minSalary") {
      values[i] = Number(values[i]);
      return `${jsToSql[key]} >= $${i + 1}`;
    }
    if (key === "maxEmployees") {
      values[i] = Number(values[i]);
      return `${jsToSql[key]} <= $${i + 1}`;
    }
    console.log("VALUES", values[i]);
    if (key === "hasEquity") {
      if (values[i] === true || values[i] === "true") {
        values[i] = 0;
        return `${jsToSql[key]} > $${i + 1}`;
      }
    }
  });
  conditionals = conditionals.join(" AND ");

  return { conditionals, values };
}

module.exports = { sqlForPartialUpdate, sqlForQueryStrings };
