"use strict";

/**
 * Genera functions/build-info.json con el commit SHA desplegado y la fecha de
 * build. Se ejecuta como paso `predeploy` de firebase.json, de modo que el
 * campo `version` de /api/health refleje el commit real que se esta subiendo.
 *
 * El archivo resultante es generado (esta en .gitignore). Si git no esta
 * disponible, escribe "unknown" sin romper el deploy.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

let commit = "unknown";
try {
  commit = execSync("git rev-parse --short HEAD", { cwd: __dirname }).toString().trim() || "unknown";
} catch (error) {
  // git no disponible: se mantiene "unknown".
}

const info = { commit, builtAt: new Date().toISOString() };
fs.writeFileSync(path.join(__dirname, "build-info.json"), `${JSON.stringify(info, null, 2)}\n`);
console.log("build-info generado:", commit);
