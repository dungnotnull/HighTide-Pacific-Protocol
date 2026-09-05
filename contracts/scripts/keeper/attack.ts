import { run } from "../keeper";

run("attack").catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
