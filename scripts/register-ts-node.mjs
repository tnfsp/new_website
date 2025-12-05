import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Register ts-node ESM loader without the experimental warning.
register("ts-node/esm", pathToFileURL("./"));
