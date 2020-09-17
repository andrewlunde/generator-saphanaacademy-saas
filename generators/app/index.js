"use strict";
const Generator = require("yeoman-generator");
const path = require("path");
const glob = require("glob");

module.exports = class extends Generator {
  prompting() {
    return this.prompt([
      {
        type: "input",
        name: "projectName",
        message: "What project name would you like?",
        validate: (s) => {
          if (/^[a-zA-Z0-9_-]*$/g.test(s)) {
            return true;
          }
          return "Please only use alphanumeric characters for the project name.";
        },
        default: "myappsaas",
      },
      {
        type: "confirm",
        name: "newDir",
        message: "Would you like to create a new directory for this project?",
        default: true,
      },
      {
        type: "input",
        name: "displayName",
        message: "What is the display name of your app?",
        default: "My SaaS App",
      },
      {
        type: "input",
        name: "description",
        message: "What is the description of your app?",
        default: "My SaaS Business Application",
      },
      {
        type: "input",
        name: "category",
        message: "What is the category of your app?",
        default: "Digital Partner Engineering",
      },
      {
        type: "confirm",
        name: "SaaSAPI",
        message: "Would you like to include an example of using the SaaS API (view subscriptions)?",
        default: false,
      },
      {
        type: "confirm",
        name: "HANA",
        message: "Would you like to include HANA persistence (schema separation)?",
        default: false,
      },
      {
        type: "input",
        name: "customDomain",
        message: "Will you be using a wildcard custom domain (eg: myappsaas.acme.com)? If so please enter it here - or simply press enter for none.",
        validate: (s) => {
          if (s === "") {
            return true;
          }
          if (/^[a-zA-Z0-9.-]*$/g.test(s)) {
            return true;
          }
          return "Please only use alphanumeric characters for the custom domain.";
        },
        default: "",
      },
      {
        type: "confirm",
        name: "routes",
        message: "Would you like to include creation/deletion of tenant routes on subscribe/unsubscribe (using the CF API)? NB: This is not necessary when using a wildcard custom domain.",
        default: false,
      },
      {
        type: "confirm",
        name: "destination",
        message: "Would you like to include an example of using the destination reuse service?",
        default: false,
      },
    ]).then((answers) => {
      if (answers.newDir) {
        this.destinationRoot(`${answers.projectName}`);
      }
      this.config.set(answers);
    });
  }

  writing() {
    this.sourceRoot(path.join(__dirname, "templates"));
    glob
      .sync("**", {
        cwd: this.sourceRoot(),
        nodir: true,
        dot: true
      })
      .forEach((file) => {
        if (!(file.includes('/.DS_Store'))) {
          if (!(this.config.get('HANA') === false && file.substr(0,3) === 'db/')) {
            if (!(file === 'srv/library.js' && this.config.get('SaaSAPI') === false && this.config.get('HANA') === false && this.config.get('routes') === false && this.config.get('destination') === false)) {
              const sOrigin = this.templatePath(file);
              const sTarget = this.destinationPath(file);
              this.fs.copyTpl(sOrigin, sTarget, this.config.getAll());
            }
          }
        }
      });
  }

  install() {
    /*
    This.installDependencies({
      bower: false,
      npm: true
    });
    */
  }

  end() {
    this.log("");
    if (this.config.get('customDomain') !== "") {
      this.log("Important: The wildcard custom domain route needs be mapped via the following CF CLI command after deployment:");
      this.log("  cf map-route " + this.config.get('projectName') + " " + this.config.get('customDomain') + ' --hostname "*"');
    }
    if (this.config.get('routes')) {
      let projectName = this.config.get('projectName');
      this.log("Important: The CF API is being used so please be sure to issue the following CF CLI commands after deployment:");
      this.log("  cf set-env " + projectName + "-srv cf_api_user '<email>'");
      this.log("  cf set-env " + projectName + "-srv cf_api_password '<password>'");
      this.log("  cf restage " + projectName + "-srv");
    }
    if (this.config.get('destination')) {
      this.log("Don't forget to configure the destination for each subscriber.");
    }
    this.log("");
  }
};
