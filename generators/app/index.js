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
        default: "app",
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
        default: "App",
      },
      {
        type: "input",
        name: "description",
        message: "What is the description of your app?",
        default: "Business Application",
      },
      {
        type: "input",
        name: "category",
        message: "What is the category of your app?",
        default: "SaaS Multitenant Apps"
      },
      {
        type: "list",
        name: "BTPRuntime",
        message: "Which runtime will you be deploying the project to?",
        choices: [{ name: "SAP BTP, Cloud Foundry runtime", value: "CF" }, { name: "SAP BTP, Kyma runtime", value: "Kyma" }],
        default: "CF"
      },
      {
        when: response => response.BTPRuntime === "Kyma",
        type: "input",
        name: "namespace",
        message: "What SAP BTP, Kyma runtime namespace will you be deploying to?",
        validate: (s) => {
          if (/^[a-z0-9-]*$/g.test(s) && s.length > 0 && s.substring(0, 1) !== '-' && s.substring(s.length - 1) !== '-') {
            return true;
          }
          return "Your SAP BTP, Kyma runtime namespace can only contain lowercase alphanumeric characters or -.";
        },
        default: "default"
      },
      {
        when: response => response.BTPRuntime === "Kyma",
        type: "input",
        name: "dockerID",
        message: "What is your Docker ID?",
        validate: (s) => {
          if (/^[a-z0-9]*$/g.test(s) && s.length >= 4 && s.length <= 30) {
            return true;
          }
          return "Your Docker ID must be between 4 and 30 characters long and can only contain numbers and lowercase letters.";
        },
        default: ""
      },
      {
        when: response => response.BTPRuntime === "Kyma",
        type: "list",
        name: "buildCmd",
        message: "How would you like to build container images?",
        choices: [{ name: "Paketo (Cloud Native Buildpacks)", value: "pack" }, { name: "Docker", value: "docker" }, { name: "Podman", value: "podman" }],
        default: "pack"
      },
      {
        type: "confirm",
        name: "SaaSAPI",
        message: "Would you like to include an example of using the SaaS API (view subscriptions)?",
        default: false,
      },
      {
        when: response => response.BTPRuntime === "CF",
        type: "confirm",
        name: "hana",
        message: "Would you like to include SAP HANA Cloud persistence (schema separation)?",
        default: false,
      },
      {
        type: "input",
        name: "customDomain",
        message: "Will you be using a wildcard custom domain (eg: app.domain.com)? If so please enter it here - or simply press enter for none.",
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
        when: response => response.BTPRuntime === "Kyma" && response.customDomain === "",
        type: "input",
        name: "clusterDomain",
        message: "What is the cluster domain of your SAP BTP, Kyma runtime?",
        default: "0000000.kyma.ondemand.com"
      },
      {
        when: response => response.BTPRuntime === "Kyma" && response.customDomain !== "",
        type: "input",
        name: "gateway",
        message: "What is the gateway for the custom domain in your SAP BTP, Kyma runtime?",
        default: "gateway-name.namespace.svc.cluster.local"
      },
      {
        type: "confirm",
        name: "routes",
        message: "Would you like to include creation/deletion of tenant routes (CF) or API Rules (Kyma) / on subscribe/unsubscribe?",
        default: true,
      },
      {
        type: "confirm",
        name: "apiDest",
        message: "Would you like to include an example of using the destination reuse service?",
        default: false,
      },
      {
        type: "confirm",
        name: "buildDeploy",
        message: "Would you like to build and deploy the project immediately?",
        default: false
      },
    ]).then((answers) => {
      if (answers.newDir) {
        this.destinationRoot(`${answers.projectName}`);
      }
      if (answers.BTPRuntime !== "Kyma") {
        answers.namespace = "";
        answers.dockerID = "";
        answers.clusterDomain = "";
        answers.gateway = "";
        answers.buildCmd = "";
      } else {
        if (answers.customDomain !== "") {
          answers.clusterDomain = answers.customDomain;
        } else {
          answers.gateway = "kyma-gateway.kyma-system.svc.cluster.local";
        }
        answers.hana = false;
      }
      answers.destinationPath = this.destinationPath();
      this.config.set(answers);
    });
  }

  writing() {
    var answers = this.config;
    // scaffold the project
    this.sourceRoot(path.join(__dirname, "templates"));
    glob
      .sync("**", {
        cwd: this.sourceRoot(),
        nodir: true,
        dot: true
      })
      .forEach((file) => {
        if (!(file.includes('.DS_Store'))) {
          if (!(answers.get('hana') === false && file.substring(0, 3) === 'db/')) {
            if (!(file === 'srv/library.js' && answers.get('SaaSAPI') === false && answers.get('routes') === false)) {
              if (!((file.substring(0, 5) === 'helm/' || file.includes('/Dockerfile') || file === 'dotdockerignore' || file === 'Makefile') && answers.get('BTPRuntime') !== 'Kyma')) {
                if (!((file.substring(0, 3) === 'db/' || file.includes('helm/_PROJECT_NAME_-db')) && answers.get('hana') === false)) {
                  if (!((file.includes('role.yaml') || file.includes('binding-role.yaml')) && answers.get('routes') === false)) {
                    if (!((file.includes('service-sm.yaml') || file.includes('binding-sm.yaml')) && answers.get('hana') === false)) {
                      if (!((file.includes('service-dest.yaml') || file.includes('binding-dest.yaml')) && answers.get('apiDest') === false)) {
                        if (!((file === 'mta.yaml' || file === 'xs-security.json') && answers.get('BTPRuntime') !== 'CF')) {
                          const sOrigin = this.templatePath(file);
                          let fileDest = file;
                          fileDest = fileDest.replace('_PROJECT_NAME_', answers.get('projectName'));
                          fileDest = fileDest.replace('dotgitignore', '.gitignore');
                          fileDest = fileDest.replace('dotdockerignore', '.dockerignore');
                          const sTarget = this.destinationPath(fileDest);
                          this.fs.copyTpl(sOrigin, sTarget, answers.getAll());
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });
  }

  install() {
    var answers = this.config;
    let opt = { "cwd": this.destinationPath() };
    if (answers.get('BTPRuntime') === "Kyma") {
      // Kyma runtime
      if (answers.get("buildDeploy")) {
        let resPush = this.spawnCommandSync("make", ["docker-push"], opt);
        if (resPush.status === 0) {
          this.spawnCommandSync("make", ["helm-deploy"], opt);
        }
      } else {
        this.log("");
        this.log("You can build and deploy your project as follows or use a CI/CD pipeline:");
        this.log(" cd " + answers.get("projectName"));
        this.log(" make docker-push");
        this.log(" make helm-deploy");
      }
    } else {
      // Cloud Foundry runtime
      var mta = "mta_archives/" + answers.get("projectName") + "_0.0.1.mtar";
      if (answers.get("buildDeploy")) {
        let resBuild = this.spawnCommandSync("mbt", ["build"], opt);
        if (resBuild.status === 0) {
          this.spawnCommandSync("cf", ["deploy", mta], opt);
        }
      } else {
        this.log("");
        this.log("You can build and deploy your project from the command line as follows:");
        this.log(" cd " + answers.get("projectName"));
        this.log(" mbt build");
        this.log(" cf deploy " + mta);
      }
    }
  }

  end() {
    var answers = this.config;
    var opt = { "cwd": answers.get("destinationPath") };
    this.log("");
    if (answers.get('customDomain') !== "" && answers.get('BTPRuntime') === 'CF') {
      this.log("Important: The wildcard custom domain route needs be mapped via the following CF CLI command after deployment:");
      this.log("  cf map-route " + answers.get('projectName') + "-app " + answers.get('customDomain') + ' --hostname "*"');
      this.log("");
    }
    if (answers.get('routes') && answers.get('BTPRuntime') === 'CF') {
      this.log("Important: The CF API is being used so please be sure to update the destination " + answers.get('projectName') + "-cfapi - Token Service URL (replace login with uaa) and set User & Password. Client Secret needs to be empty.");
      this.log("");
    }
    if (answers.get('apiDest')) {
      this.log("Don't forget to configure the destination for each subscriber.");
      this.log("");
    }
  }
};