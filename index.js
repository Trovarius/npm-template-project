#!/usr/bin/env node
const inquirer = require('inquirer');
const deepmerge = require('deepmerge');
const fs = require('fs');

const CHOICES = fs.readdirSync(`${__dirname}/templates/projects`);
const EXTRAS = fs.readdirSync(`${__dirname}/templates/extras`);

const QUESTIONS = [
  {
    name: 'project-choice',
    type: 'list',
    message: 'What project template would you like to generate?',
    choices: CHOICES
  },
  {
    name: 'project-extras',
    type: 'checkbox',
    message: 'What project extras would you like to generate?',
    choices: EXTRAS
  },
  {
    name: 'project-author',
    type: 'input',
    message: 'Who is the author of this project?',
  },
  {
    name: 'project-name',
    type: 'input',
    message: 'Project name:',
    validate: function (input) {
      if (/^([A-Za-z\-\_\d])+$/.test(input)) return true;
      else return 'Project name may only include letters, numbers, underscores and hashes.';
    }
  }
];

const CURR_DIR = process.cwd();

inquirer.prompt(QUESTIONS)
  .then(answers => {
    console.log(answers);
    const projectChoice = answers['project-choice'];
    const projectName = answers['project-name'];
    const templatePath = `${__dirname}/templates/projects/${projectChoice}`;
    const extrasPath = answers['project-extras'].map(extra => `${__dirname}/templates/extras/${extra}`);
    
    const replaceVariables ={
        "{{PROJECT_NAME}}": answers['project-name'],
        "{{AUTHOR}}": answers['project-author']
    }

    fs.mkdirSync(`${CURR_DIR}/${projectName}`);

    let packageJson = [];

    [templatePath, ...extrasPath].forEach(path => {
        createDirectoryContents(path, projectName, packageJson, replaceVariables)
    });
    
    const writePath = `${CURR_DIR}/${projectName}/package.json`;

    unifyPackageJson(writePath, packageJson, replaceVariables)
});

function createDirectoryContents (templatePath, newProjectPath, packageJson, replaceVariables) {
    const filesToCreate = fs.readdirSync(templatePath);
  
    filesToCreate.forEach(file => {
      const origFilePath = `${templatePath}/${file}`;
      
      // get stats about the current file
      const stats = fs.statSync(origFilePath);
      if(file === "package.json"){
        const contents = fs.readFileSync(origFilePath, 'utf8');
        packageJson.push(contents);

      } else if (stats.isFile()) {
        const contents = fs.readFileSync(origFilePath, 'utf8');
        
        //Renaming npmignore back to gitignore
        if (file === '.npmignore') file = '.gitignore';
    
        const writePath = `${CURR_DIR}/${newProjectPath}/${file}`;
        createFileWithVariables(origFilePath,writePath, replaceVariables )
        
      } else if (stats.isDirectory()) {
        fs.mkdirSync(`${CURR_DIR}/${newProjectPath}/${file}`);
        
        // recursive call
        createDirectoryContents(`${templatePath}/${file}`, `${newProjectPath}/${file}`,packageJson, replaceVariables);
      }
    });
  }

  function unifyPackageJson(destinyPath, packagesJson, replaceObject){
    var uniquePackage = {};

    for(let index in packagesJson){
        let package = packagesJson[index];

        for(let key in replaceObject){
            if(!replaceObject.hasOwnProperty(key)) continue;

            package = package.replace(key, replaceObject[key]);
        }
        
        uniquePackage = deepmerge(uniquePackage, JSON.parse(package))
    }
    
    console.log(uniquePackage);

    fs.writeFile(destinyPath, JSON.stringify(uniquePackage), 'utf8', function(err) {
        if (err) {
           return console.log(err);
        };
    });
  }

  function createFileWithVariables(originalPath, destinyPath, replaceObject){
    fs.readFile(originalPath, 'utf8', function(err, data) {
        if (err) {
          return console.log(err);
        }
        
        for(let key in replaceObject){
            if(!replaceObject.hasOwnProperty(key)) continue;

            var result = data.replace(key, replaceObject[key]);
        }

        fs.writeFile(destinyPath, result, 'utf8', function(err) {
            if (err) {
               return console.log(err);
            };
        });
    });
  }