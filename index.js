#!/usr/bin/env/ node
const inquirer = require('inquirer');
const fs = require('fs');

const CHOICES = fs.readdirSync(`${__dirname}/templates/projects`);
const EXTRAS = ["None", ...fs.readdirSync(`${__dirname}/templates/extras`)];

const QUESTIONS = [
  {
    name: 'project-choice',
    type: 'list',
    message: 'What project template would you like to generate?',
    choices: CHOICES
  },
  {
    name: 'project-extras',
    type: 'list',
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
    const projectChoice = answers['project-choice'];
    const projectName = answers['project-name'];
    const templatePath = `${__dirname}/templates/projects/${projectChoice}`;
  
    fs.mkdirSync(`${CURR_DIR}/${projectName}`);

    createDirectoryContents(templatePath, projectName, answers);
});

function createDirectoryContents (templatePath, newProjectPath, answers) {
    const filesToCreate = fs.readdirSync(templatePath);
  
    filesToCreate.forEach(file => {
      const origFilePath = `${templatePath}/${file}`;
      
      // get stats about the current file
      const stats = fs.statSync(origFilePath);
  
      if (stats.isFile()) {
        const contents = fs.readFileSync(origFilePath, 'utf8');
        
        //Renaming npmignore back to gitignore
        if (file === '.npmignore') file = '.gitignore';
        
        const replaceVariables ={
            "{{PROJECT_NAME}}": answers['project-name'],
            "{{AUTHOR}}": answers['project-author']
        }

        const writePath = `${CURR_DIR}/${newProjectPath}/${file}`;
        createFileWithVariables(origFilePath,writePath, replaceVariables )
        
      } else if (stats.isDirectory()) {
        fs.mkdirSync(`${CURR_DIR}/${newProjectPath}/${file}`);
        
        // recursive call
        createDirectoryContents(`${templatePath}/${file}`, `${newProjectPath}/${file}`, answers);
      }
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