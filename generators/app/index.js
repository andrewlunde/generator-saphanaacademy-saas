"use strict";
const Generator = require("yeoman-generator");
const path = require("path");
const glob = require("glob");

module.exports = class extends Generator {
  initializing() {
    process.chdir(this.destinationRoot());
  }

  async prompting() {
    // defaults
    const answers = {};
    answers.projectName = "app";
    answers.newDir = true;
    answers.displayName = "App";
    answers.description = "Business Application";
    answers.category = "SaaS Multitenant Apps";
    answers.BTPRuntime = "CF";
    answers.namespace = "default";
    answers.dockerID = "";
    answers.dockerRepositoryName = "";
    answers.dockerRepositoryVisibility = "public";
    answers.dockerRegistrySecretName = "docker-registry-config";
    answers.dockerServerURL = "https://index.docker.io/v1/";
    answers.dockerEmailAddress = "";
    answers.dockerPassword = "";
    answers.kubeconfig = "";
    answers.buildCmd = "pack";
    answers.SaaSAPI = false;
    answers.hana = false;
    answers.customDomain = "";
    answers.clusterDomain = "0000000.kyma.ondemand.com";
    answers.gateway = "kyma-gateway.kyma-system.svc.cluster.local";
    answers.routes = true;
    answers.apiDest = false;
    answers.externalSessionManagement = false;
    answers.buildDeploy = false;
    // prompts
    const answers1 = await this.prompt([
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
        default: answers.projectName
      },
      {
        type: "confirm",
        name: "newDir",
        message: "Would you like to create a new directory for this project?",
        default: answers.newDir
      },
      {
        type: "input",
        name: "displayName",
        message: "What is the display name of your app?",
        default: answers.displayName
      },
      {
        type: "input",
        name: "description",
        message: "What is the description of your app?",
        default: answers.description
      },
      {
        type: "input",
        name: "category",
        message: "What is the category of your app?",
        default: answers.category
      },
      {
        type: "list",
        name: "BTPRuntime",
        message: "Which runtime will you be deploying the project to?",
        choices: [{ name: "SAP BTP, Cloud Foundry runtime", value: "CF" }, { name: "SAP BTP, Kyma runtime", value: "Kyma" }],
        default: answers.BTPRuntime
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
        default: answers.namespace
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
        default: answers.dockerID
      },
      {
        when: response => response.BTPRuntime === "Kyma",
        type: "input",
        name: "dockerRepositoryName",
        message: "What is your Docker repository name? Leave blank to create a separate repository for each microservice.",
        validate: (s) => {
          if ((/^[a-z0-9-_]*$/g.test(s) && s.length >= 2 && s.length <= 225) || s === "") {
            return true;
          }
          return "Your Docker repository name must be between 2 and 255 characters long and can only contain numbers, lowercase letters, hyphens (-), and underscores (_).";
        },
        default: answers.dockerRepositoryName
      },
      {
        when: response => response.BTPRuntime === "Kyma",
        type: "list",
        name: "dockerRepositoryVisibility",
        message: "What is your Docker repository visibility?",
        choices: [{ name: "Public (Appears in Docker Hub search results)", value: "public" }, { name: "Private (Only visible to you)", value: "private" }],
        default: answers.dockerRepositoryVisibility
      },
      {
        when: response => response.BTPRuntime === "Kyma" && response.dockerRepositoryVisibility === "private",
        type: "input",
        name: "dockerRegistrySecretName",
        message: "What is the name of your Docker Registry Secret? It will be created in the namespace if you specify your Docker Email Address and Docker Personal Access Token or Password.",
        default: answers.dockerRegistrySecretName
      },
      {
        when: response => response.BTPRuntime === "Kyma" && response.dockerRepositoryVisibility === "private",
        type: "input",
        name: "dockerServerURL",
        message: "What is your Docker Server URL?",
        default: answers.dockerServerURL
      },
      {
        when: response => response.BTPRuntime === "Kyma" && response.dockerRepositoryVisibility === "private",
        type: "input",
        name: "dockerEmailAddress",
        message: "What is your Docker Email Address? Leave empty if your Docker Registry Secret already exists in the namespace.",
        default: answers.dockerEmailAddress
      },
      {
        when: response => response.BTPRuntime === "Kyma" && response.dockerRepositoryVisibility === "private",
        type: "password",
        name: "dockerPassword",
        message: "What is your Docker Personal Access Token or Password? Leave empty if your Docker Registry Secret already exists in the namespace.",
        mask: "*",
        default: answers.dockerPassword
      },
      {
        when: response => response.BTPRuntime === "Kyma",
        type: "input",
        name: "kubeconfig",
        message: "What is the path of your Kubeconfig file? Leave blank to use the KUBECONFIG environment variable instead.",
        default: answers.kubeconfig
      },
      {
        when: response => response.BTPRuntime === "Kyma",
        type: "list",
        name: "buildCmd",
        message: "How would you like to build container images?",
        choices: [{ name: "Paketo (Cloud Native Buildpacks)", value: "pack" }, { name: "Docker", value: "docker" }, { name: "Podman", value: "podman" }],
        default: answers.buildCmd
      },
      {
        type: "confirm",
        name: "SaaSAPI",
        message: "Would you like to include an example of using the SaaS API (view subscriptions)?",
        default: answers.SaaSAPI
      },
      {
        type: "confirm",
        name: "hana",
        message: "Would you like to use SAP HANA Cloud?",
        default: answers.hana
      },
      {
        type: "input",
        name: "customDomain",
        message: "Will you be using a wildcard custom domain (eg: apps.domain.com)? If so please enter the custom domain name here. Leave blank to use the platform default.",
        validate: (s) => {
          if (s === "") {
            return true;
          }
          if (/^[a-zA-Z0-9.-]*$/g.test(s)) {
            return true;
          }
          return "Please only use alphanumeric characters for the custom domain.";
        },
        default: answers.customDomain
      }
    ]);
    if (answers1.BTPRuntime === "Kyma" && answers1.customDomain === "") {
      let cmd = ["get", "cm", "shoot-info", "-n", "kube-system", "-o", "jsonpath='{.data.domain}'"];
      if (answers1.kubeconfig !== "") {
        cmd.push("--kubeconfig", answers1.kubeconfig);
      }
      let opt = { "cwd": answers1.destinationPath, "stdio": [process.stdout] };
      let resGet = this.spawnCommandSync("kubectl", cmd, opt);
      if (resGet.exitCode === 0) {
        answers.clusterDomain = resGet.stdout.toString().replace(/'/g, '');
      }
    } else {
      answers.clusterDomain = answers1.customDomain;
    }
    const answers2 = await this.prompt([
      {
        when: answers1.BTPRuntime === "Kyma" && answers1.customDomain === "",
        type: "input",
        name: "clusterDomain",
        message: "What is the cluster domain of your SAP BTP, Kyma runtime?",
        default: answers.clusterDomain
      },
      {
        when: answers1.BTPRuntime === "Kyma" && answers1.customDomain !== "",
        type: "input",
        name: "gateway",
        message: "What is the gateway for the custom domain in your SAP BTP, Kyma runtime?",
        default: answers.gateway
      },
      {
        type: "confirm",
        name: "routes",
        message: "Would you like to include creation/deletion of tenant routes (CF) or API Rules (Kyma) / on subscribe/unsubscribe?",
        default: answers.routes
      },
      {
        type: "confirm",
        name: "apiDest",
        message: "Would you like to include an example of using the destination reuse service?",
        default: answers.apiDest
      },
      {
        when: answers1.BTPRuntime === "Kyma",
        type: "confirm",
        name: "externalSessionManagement",
        message: "Would you like to configure external session management (using Redis)?",
        default: answers.externalSessionManagement
      },
      {
        type: "confirm",
        name: "buildDeploy",
        message: "Would you like to build and deploy the project?",
        default: answers.buildDeploy
      }
    ]);
    if (answers1.newDir) {
      this.destinationRoot(`${answers1.projectName}`);
    }
    answers.destinationPath = this.destinationPath();
    this.config.set(answers);
    this.config.set(answers1);
    this.config.set(answers2);
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
                        if (!((file.includes('-redis.yaml') || file.includes('destinationrule.yaml')) && answers.get('externalSessionManagement') === false)) {
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
        }
      });
  }

  async install() {
    var answers = this.config;
    let opt = { "cwd": this.destinationPath() };
    if (answers.get('BTPRuntime') === "Kyma") {
      // Kyma runtime
      let cmd;
      if (answers.get("dockerRepositoryVisibility") === "private" && !(answers.get("dockerEmailAddress") === "" && answers.get("dockerPassword") === "")) {
        cmd = ["create", "secret", "docker-registry", answers.get("dockerRegistrySecretName"), "--docker-server", answers.get("dockerServerURL"), "--docker-username", answers.get("dockerID"), "--docker-email", answers.get("dockerEmailAddress"), "--docker-password", answers.get("dockerPassword"), "-n", answers.get("namespace")];
        if (answers.get("kubeconfig") !== "") {
          cmd.push("--kubeconfig", answers.get("kubeconfig"));
        }
        this.spawnCommandSync("kubectl", cmd, opt);
      }
      if (answers.get("externalSessionManagement") === true) {
        // generate secret
        const k8s = require('@kubernetes/client-node');
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();
        let k8sApi = kc.makeApiClient(k8s.CoreV1Api);
        this.log('Creating the external session management secret...');
        let pwdgen = require('generate-password');
        let redisPassword = pwdgen.generate({
          length: 64,
          numbers: true
        });
        let sessionSecret = pwdgen.generate({
          length: 64,
          numbers: true
        });
        let k8sSecret = {
          apiVersion: 'v1',
          kind: 'Secret',
          metadata: {
            name: answers.get('projectName') + '-redis-binding-secret',
            labels: {
              'app.kubernetes.io/managed-by': answers.get('projectName') + '-app'
            }
          },
          type: 'Opaque',
          data: {
            EXT_SESSION_MGT: Buffer.from('{"instanceName":"' + answers.get("projectName") + '-redis", "storageType":"redis", "sessionSecret": "' + sessionSecret + '"}', 'utf-8').toString('base64'),
            REDIS_PASSWORD: Buffer.from('"' + redisPassword + '"', 'utf-8').toString('base64'),
            ".metadata": Buffer.from('{"credentialProperties":[{"name":"hostname","format":"text"},{"name":"port","format":"text"},{"name":"password","format":"text"},{"name":"cluster_mode","format":"text"},{"name":"tls","format":"text"}],"metaDataProperties":[{"name":"instance_name","format":"text"},{"name":"type","format":"text"},{"name":"label","format":"text"}]}', 'utf-8').toString('base64'),
            instance_name: Buffer.from(answers.get('projectName') + '-db-' + answers.get('schemaName'), 'utf-8').toString('base64'),
            type: Buffer.from("redis", 'utf-8').toString('base64'),
            name: Buffer.from(answers.get("projectName") + "-redis", 'utf-8').toString('base64'),
            instance_name: Buffer.from(answers.get("projectName") + "-redis", 'utf-8').toString('base64'),
            hostname: Buffer.from(answers.get("projectName") + "-redis", 'utf-8').toString('base64'),
            port: Buffer.from("6379", 'utf-8').toString('base64'),
            password: Buffer.from(redisPassword, 'utf-8').toString('base64'),
            cluster_mode: Buffer.from("false", 'utf-8').toString('base64'),
            tls: Buffer.from("false", 'utf-8').toString('base64')
          }
        };
        await k8sApi.createNamespacedSecret(
          answers.get('namespace'),
          k8sSecret
        ).catch(e => this.log("createNamespacedSecret:", e.response.body));
      }
      if (answers.get("buildDeploy")) {
        let resPush = this.spawnCommandSync("make", ["docker-push"], opt);
        if (resPush.exitCode === 0) {
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
        if (resBuild.exitCode === 0) {
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