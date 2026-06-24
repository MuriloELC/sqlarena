const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "..", "src", "shared", "sql-security.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});

const moduleScope = { exports: {} };
vm.runInNewContext(compiled.outputText, {
  module: moduleScope,
  exports: moduleScope.exports,
  require,
  console,
}, { filename: sourcePath });

const {
  SqlValidationError,
  validateChallengeSql,
  validateValidationSql,
} = moduleScope.exports;

function assertAllowed(sql, tables, type = "free_select") {
  assert.equal(validateChallengeSql(sql, tables, type), sql.replace(/;$/, ""));
}

function assertBlocked(sql, tables, type, expectedMessage) {
  assert.throws(
    () => validateChallengeSql(sql, tables, type),
    (error) => error instanceof SqlValidationError && error.message.includes(expectedMessage),
  );
}

assertAllowed("SELECT name FROM products", ["products"]);
assertAllowed("INSERT INTO products (name) VALUES ('Monitor')", ["products"], "insert_rows");
assertAllowed("UPDATE products SET price = 1350 WHERE sku = 'MON-27'", ["products"], "update_rows");
assertAllowed("DELETE FROM products WHERE sku = 'BOOK-SQL'", ["products"], "delete_rows");
assertAllowed("CREATE TABLE suppliers (id uuid PRIMARY KEY)", ["suppliers"], "create_table");
assertAllowed("ALTER TABLE products ADD COLUMN restock_date date", ["products"], "alter_table");
assertAllowed("DROP TABLE staging_imports", ["staging_imports"], "drop_table");

assertBlocked("INSERT INTO products (name) VALUES ('Monitor')", ["products"], "free_select", "SELECT ou WITH");
assertBlocked("UPDATE products SET price = 1350", ["products"], "update_rows", "UPDATE deve usar WHERE");
assertBlocked("DELETE FROM products", ["products"], "delete_rows", "DELETE deve usar WHERE");
assertBlocked("DROP TABLE public.products", ["products"], "drop_table", "schema explicito");
assertBlocked("DROP TABLE products; DROP TABLE orders", ["products"], "drop_table", "uma statement");
assertBlocked("CREATE TABLE \"suppliers\" (id uuid)", ["suppliers"], "create_table", "aspas");
assertBlocked("INSERT INTO orders (id) VALUES ('1')", ["products"], "insert_rows", "orders");

assert.equal(validateValidationSql("SELECT count(*)::int AS total FROM products"), "SELECT count(*)::int AS total FROM products");
assert.throws(() => validateValidationSql("UPDATE products SET price = 1"), /SELECT ou WITH/);

console.log("sql-security checks passed");
