#!/usr/bin/env node
import open from "open";
import fs from "fs";
import { exec } from "child_process";
import readline from "readline";
import {
  generateRequestBody,
  generateResponseExample,
  convertToInsomniaFormat
} from "./swaggerjson.js";
import {
  generatePhpAnnotationsByTag,
  writePhpAnnotationFiles
} from "./annotations.mjs";
let [, , option, inputPath] = process.argv;
if (option === "install") {
  const composerCommand = 'composer require "darkaonline/l5-swagger"';
  const artisanCommand =
    'php artisan vendor:publish --provider "L5Swagger\\L5SwaggerServiceProvider"';
  const optimizeCommand = "php artisan optimize:clear";
  const serveCommand = "php artisan serve";
  // Fonction pour exécuter une commande
  function runCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(
            `Error executing command : ${error.message}`
          );
        } else {
          "darkaonline/l5-swagger installed successfully. Server is now running."
          resolve(stdout || stderr);
        }
      });
    });
  }
  // Fonction principale pour exécuter les commandes
  async function installL5SwaggerAndServe() {
    try {
      // Exécutez la commande Composer
      const composerOutput = await runCommand(composerCommand);
      console.log("Composer Output:", composerOutput);
      // Exécutez la commande Artisan
      const artisanOutput = await runCommand(artisanCommand);
      console.log("Artisan Output:", artisanOutput);
      // Exécutez la commande Optimize
      const optimizedCommand = await runCommand(optimizeCommand);
      console.log("Optimize Output:", optimizedCommand);
      // Exécutez la commande Artisan pour démarrer le serveur
      const serveOutput = await runCommand(serveCommand);
      console.log("darkaonline/l5-swagger installed successfully. Server is now running.\n ", serveOutput);
      // Ouvrir automatiquement le navigateur avec l'URL spécifiée
      await open("http://127.0.0.1:8000/api/documentation");
    } catch (error) {
      console.error(error);
    }
  }
  // Appelez la fonction principale
  installL5SwaggerAndServe();
} else if (option === "update") {
  function runCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(`${error.message}`);
        } else {
          resolve(stdout || stderr);
        }
      });
    });
  }

  const npmUninstallCommand = "npm uninstall -g insomswagger";
  const npmInstallCommand = "npm install -g insomswagger";

  // Fonction pour exécuter une commande npm
  async function runNpmCommand(command) {
    try {
      await runCommand(command);
      // Après la désinstallation, exécute la commande npm install
      const installResult = await runCommand(npmInstallCommand);
      console.log(`${installResult}`);
    } catch (error) {
      console.error(`${error}`);
    }
  }
  // Exécute la commande npm uninstall
  runNpmCommand(npmUninstallCommand)
    .then(() => {
      // Après la désinstallation, exécute la commande npm install
      return runNpmCommand(npmInstallCommand);
    })
    .catch((error) => {
      console.error(`${error}`);
    });
} else if (option === "-doc") {
  if (!inputPath) {
    throw new Error("Missing Input Path argument!");
  }
  const inputJson = JSON.parse(
    fs.readFileSync(inputPath, { encoding: "utf8", flag: "r" })
  );
  const file = convertToInsomniaFormat(inputJson);
  const swagger = {
    openapi: "3.0.0",
    info: {
      title: "Your API Title",
      description: "Your API Description",
      version: "1.0.0",
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    consumes: ["multipart/form-data"],
    paths: file.resources.reduce((ac, item) => {
      if (!item.url || !item.method) {
        return ac;
      }

      const indexOfApi = item.url.indexOf("/api/");
      const extractedUrl =
        indexOfApi !== -1 ? item.url.substring(indexOfApi) : item.url;
      const key = extractedUrl;

      ac[key] = ac[key] || {};
      item.method = item.method.toLowerCase();

      ac[key][item.method] = {
        summary: item.name || "",
        description: item.description || "",
        responses: generateResponseExample(item),
        tags: [
          item.parentId
            ? file.resources.find((resource) => resource._id === item.parentId)
              ?.name || ""
            : "",
        ],
      };
      ac[key][item.method].parameters = [];
      if (item.parameters && item.parameters.length) {
        ac[key][item.method].parameters.push(
          ...item.parameters.map((param) => ({
            in: "path",
            name: param.name || "",
            type: param.type || "string",
          }))
        );
      }
      if (item.headers && item.headers.length) {
        ac[key][item.method].parameters.push(
          ...item.headers
            .filter((p) => p.name !== "Content-Type")
            .map((p) => ({
              in: "header",
              name: p.name || "",
              type: p.type || "string",
            }))
        );
      }
      const requestBody = generateRequestBody(item);
      if (requestBody) {
        ac[key][item.method].requestBody = requestBody;
      }

      return ac;
    }, {}),
  };
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("Do you want to generate Swagger annotations? (yes/no) :   ", (answer) => {
    // Close the readline interface
    rl.close();

    // Convert the answer to lowercase for comparison
    const response = answer.trim().toLowerCase();

    if (response === "yes") {
      fs.mkdirSync("storage/api-docs/", { recursive: true });
      fs.writeFileSync("storage/api-docs/api-docs.json", JSON.stringify(swagger, null, 4));
      console.log(
        `Swagger documentation generated and written to JSON file successfully:"storage/api-docs/api-docs.json"`
      );
      // Script de génération Annotations PHP
      const annotationsByTag = generatePhpAnnotationsByTag(swagger);
      fs.mkdirSync("app/Http/Controllers/Annotations", { recursive: true });
      writePhpAnnotationFiles(annotationsByTag, swagger);
    } else if (response === "no") {
      fs.mkdirSync("storage/api-docs/", { recursive: true });
      fs.writeFileSync("storage/api-docs/api-docs.json", JSON.stringify(swagger, null, 4));
      console.log(
        `Swagger documentation generated and written to JSON file successfully: "storage/api-docs/api-docs.json"`
      );
    } else {
      console.error("Invalid response. Please use 'yes' or 'no'.");
    }
  });

} else {
  console.error(
    'Invalid option. Use "-doc" for Swagger JSON  documentation or Swagger annotations, "install" to install L5-swagger, or "update" to update insomswagger version.'
  );
}
