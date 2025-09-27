import * as fs from "fs";
import * as path from "path";

const findRootEnv = (searchPath: string) => {
  if (searchPath === "/") {
    throw new Error(".env file doesn't exist");
  }

  if (fs.readdirSync(searchPath).find((file) => file === ".env")) {
    return searchPath;
  }

  // go up one level each time we don't find it
  return findRootEnv(path.join(searchPath, "../"));
};

// we put our .env at the root, so a way of finding the root
// and not hardcoding it is to find the .env
export const projectRootPath = findRootEnv(__dirname);
export const projectEnvPath = path.join(projectRootPath, ".env");

export const frontendDistPath = path.join(
  projectRootPath,
  "apps/frontend/dist"
);
