import { run } from "../keeper";

run("lanina").catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
