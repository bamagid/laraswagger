# Swaggerize

## Introduction
Swaggerize simplifies the process of converting exported JSON from **Insomnia** or **Postman** into **Swagger documentation** for Laravel projects. This tool allows for the generation of Swagger JSON files or PHP annotations, providing flexibility based on project requirements.
## Installation
Make sure you have **Node.js** installed on your machine. Then, install Swaggerize globally:
```bash

npm install -g swaggerize

```
# Usage
   ## Testing and Exporting Requests:
        Test your API endpoints using Insomnia or Postman.
        Export requests to JSON format and save the file in your Laravel project’s root directory.
   ## Generating Documentation:
        Navigate to your Laravel project directory and run the following command:
  ``` bash

        swaggerize -doc exported_file.json

  ```
       Respond to the prompt regarding annotations with “yes” or “no”. If annotations are generated, they’ll be saved in app/Http/Controllers/Annotations/. Use the namespace from each annotation file in the corresponding controller.
   ## Viewing Swagger Documentation:
        To view Swagger documentation in your Laravel project, use tools like Darkaonline/L5-Swagger. Install L5-Swagger by running:
  ```bash

        swaggerize install

  ```
  ##  Path Parameters:
        Provide values for path parameters in Insomnia or Postman by adding parameters with the same name as those in your routes, enclosed in curly braces {}. For example, if you have a route defined as /users/{userId}, add a parameter named userId with the value you want to test.
   ## Testing with Files and Multipart Support:
        Uploading Files: Use multipart/form-data in Insomnia or Postman to upload files.
        Multipart Requests: Configure requests with multipart/form-data to send multiple types of data.
   ##  Update Swaggerize:
       To update Swaggerize to the latest version, run:
  ```bash

        swaggerize update

   ```
License
This package is licensed under the MIT License. See LICENSE.md for details.

```


```