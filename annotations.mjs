#!/usr/bin/env node
import fs from "fs";
function generatePhpAnnotationsByTag(swaggerData) {
    const annotationsByTag = {};
    if (swaggerData) {
      Object.keys(swaggerData.paths).forEach((path) => {
        const pathObject = swaggerData.paths[path];
        Object.keys(pathObject).forEach((method) => {
          const operation = pathObject[method];
          const tags = operation.tags || [];
          const summary = operation.summary || "";
          const description = operation.description || "";
          // Générer les annotations de chemin
          tags.forEach((tag) => {
            // Initialiser la chaîne d'annotations si elle n'existe pas
            if (!annotationsByTag[tag]) {
              annotationsByTag[tag] = "";
            }
            // Générer les annotations pour chaque opération
            annotationsByTag[tag] += "\n";
            annotationsByTag[tag] += ` * @OA\\${method.toUpperCase()}(\n`;
            annotationsByTag[tag] += ` *     path="${path}",\n`;
            annotationsByTag[tag] += ` *     summary="${summary}",\n`;
            annotationsByTag[tag] += ` *     description="${description}",\n`;
            // Générer les annotations pour la sécurité
            annotationsByTag[tag] += ` *         security={\n`;
            annotationsByTag[tag] += ` *    {       "BearerAuth": {}}\n`;
            annotationsByTag[tag] += ` *         },\n`;
            // Générer les annotations pour les réponses
            if (operation.responses) {
              const responseCodes = Object.keys(operation.responses);
              responseCodes.forEach((responseCode) => {
                const response = operation.responses[responseCode];
                const responseDescription = response.description || "";
  
                annotationsByTag[
                  tag
                ] += ` * @OA\\Response(response="${responseCode}", description="${responseDescription}"`;
  
                // Générer les annotations pour le contenu de la réponse
                if (response.content) {
                  const contentTypes = Object.keys(response.content);
  
                  if (contentTypes.length > 0) {
                    const firstContentType = contentTypes[0];
  
                    if (response.content[firstContentType].examples) {
                      const examples =
                        response.content[firstContentType].examples;
  
                      if (examples["application/json"]) {
                        annotationsByTag[tag] += ", @OA\\JsonContent(";
                        annotationsByTag[
                          tag
                        ] += `example="${examples["application/json"]}"`;
                        annotationsByTag[tag] += "),";
                      }
                    }
                  }
                }
  
                annotationsByTag[tag] += "),\n";
              });
            }
            // Générer les annotations pour les paramètres
            if (operation.parameters) {
              operation.parameters.forEach((parameter) => {
                const inType = parameter.in;
                const parameterName = parameter.name;
                const parameterType = parameter.type || "string";
                const parameterRequired = parameter.required ? "true" : "false";
                annotationsByTag[
                  tag
                ] += ` *     @OA\\Parameter(in="${inType}", name="${parameterName}", `;
                annotationsByTag[
                  tag
                ] += `required=${parameterRequired}, @OA\\Schema(type="${parameterType}")\n`;
                annotationsByTag[tag] += " * ),\n";
              });
            }
            // Générer les annotations pour le requestBody
            if (operation.requestBody) {
              const requestBody = operation.requestBody;
              const contentTypes = Object.keys(requestBody.content);
  
              annotationsByTag[tag] += ` *     @OA\\RequestBody(\n`;
              annotationsByTag[tag] += ` *         required=true,\n`;
  
              if (contentTypes.length > 0) {
                const firstContentType = contentTypes[0];
                let contentType;
                if (
                  method.toUpperCase() === "PUT" ||
                  method.toUpperCase() === "PATCH"
                ) {
                  contentType = "application/x-www-form-urlencoded";
                } else {
                  contentType = "multipart/form-data";
                }
                annotationsByTag[tag] += ` *         @OA\\MediaType(\n`;
                annotationsByTag[
                  tag
                ] += ` *             mediaType="${contentType}",\n`;
                annotationsByTag[tag] += ` *             @OA\\Schema(\n`;
                annotationsByTag[tag] += ` *                 type="object",\n`;
                annotationsByTag[tag] += ` *                 properties={\n`;
  
                // Générer les annotations pour chaque propriété du formulaire
                const formProperties =
                  requestBody.content[firstContentType].schema.properties;
                Object.keys(formProperties).forEach((propertyName) => {
                  const property = formProperties[propertyName];
                  const propertyType = property.type || "string";
  
                  annotationsByTag[
                    tag
                  ] += ` *                     @OA\\Property(property="${propertyName}", type="${propertyType}"`;
                  if (property.format === "binary") {
                    annotationsByTag[tag] += `, format="binary"`;
                  }
  
                  annotationsByTag[tag] += `),\n`;
                });
  
                annotationsByTag[tag] += ` *                 },\n`;
                annotationsByTag[tag] += ` *             ),\n`;
                annotationsByTag[tag] += ` *         ),\n`;
              }
  
              annotationsByTag[tag] += ` *     ),\n`;
            }
            if (operation.tags) {
              annotationsByTag[tag] += ` *     tags={"${operation.tags.join(
                '","'
              )}"},\n`;
            }
            annotationsByTag[tag] += `*),\n\n`;
          });
        });
      });
    }
    return annotationsByTag;
  }
  function writePhpAnnotationFiles(annotationsByTag, swaggerData) {
    let annotations = "<?php\n\n";
    annotations += `namespace App\\Http\\Controllers\\Annotations ;\n\n`;
    // Générer les annotations de sécurité
    if (swaggerData.components && swaggerData.components.securitySchemes) {
      const securitySchemes = swaggerData.components.securitySchemes;
      Object.keys(securitySchemes).forEach((schemeName) => {
        const securityScheme = securitySchemes[schemeName];
        annotations += "/**\n * @OA\\Security(\n";
        annotations += " *     security={\n";
        annotations += ` *         "${schemeName}": {}\n`;
        annotations += " *     }),\n";
        annotations += "\n * @OA\\SecurityScheme(\n";
        annotations += ` *     securityScheme="${schemeName}",\n`;
        annotations += ` *     type="${securityScheme.type}",\n`;
        annotations += ` *     scheme="${securityScheme.scheme}",\n`;
        annotations += ` *     bearerFormat="${securityScheme.bearerFormat}"),\n`;
      });
    }
    // Générer les annotations d'information
    if (swaggerData.info) {
      annotations += "\n * @OA\\Info(\n";
      const info = swaggerData.info;
      annotations += ` *     title="${info.title}",\n`;
      annotations += ` *     description="${info.description}",\n`;
      annotations += ` *     version="${info.version}"),\n`;
    }
    // Générer les annotations de consommation
    if (swaggerData.consumes) {
      annotations += "\n * @OA\\Consumes({\n";
      annotations += ` *     "${swaggerData.consumes.join('","')}"\n`;
      annotations += " * }),\n\n";
      annotations += " *\n";
    }
    Object.keys(annotationsByTag).forEach((tag) => {
      const phpAnnotations = annotations + annotationsByTag[tag];
      const capitalizedTag = tag.charAt(0).toUpperCase() + tag.slice(1) + "AnnotationController";
      const name = capitalizedTag.replace(/[^a-z0-9]/gi, "");
      const fileName = name + ".php";
      fs.writeFileSync("app/Http/Controllers/Annotations/" + fileName, phpAnnotations + `\n*/\n\n class ${name} {}\n`, "utf-8");
      console.log(
        `Swagger annotations for the tag "${tag}" generated and written to the file: ${fileName}`
      );
    });
  }
export { generatePhpAnnotationsByTag, writePhpAnnotationFiles };
