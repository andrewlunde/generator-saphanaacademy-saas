module.exports = {
<% if (SaaSAPI) {-%>
    getSubscriptions: getSubscriptions <% if (routes) { -%>,<% } -%>
<% } -%>
<% if (routes) {-%>

    createRoute: createRoute,
    deleteRoute: deleteRoute
<% } -%>
};

<% if (BTPRuntime === 'CF' && routes) {-%>
const cfenv = require('cfenv');
const appEnv = cfenv.getAppEnv();
<% } -%>

<% if ((BTPRuntime === 'CF' && routes) || SaaSAPI) {-%>
const httpClient = require('@sap-cloud-sdk/http-client');
<% } -%>

<% if (SaaSAPI) {-%>
async function getSubscriptions(registry) {
    try {
        // get subscriptions
        let res = await httpClient.executeHttpRequest({ destinationName: '<%= projectName %>-registry' }, {
            method: 'GET',
            url: '/saas-manager/v1/application/subscriptions'
        });
        return res.data;
    } catch (err) {
        console.log(err.stack);
        return err.message;
    }
};
<% } -%>

<% if (routes) {-%>
<% if (BTPRuntime === 'CF') {-%>
async function getCFInfo(appname) {
    try {
        // get app GUID
        let res1 = await httpClient.executeHttpRequest({ destinationName: '<%= projectName %>-cfapi' }, {
            method: 'GET',
            url: '/v3/apps?organization_guids=' + appEnv.app.organization_id + '&space_guids=' + appEnv.app.space_id + '&names=' + appname
        });
        // get domain GUID
        let res2 = await httpClient.executeHttpRequest({ destinationName: '<%= projectName %>-cfapi' }, {
            method: 'GET',
            url: '/v3/domains?names=' + /\.(.*)/gm.exec(appEnv.app.application_uris[0])[1]
        });
        let results = {
            'app_id': res1.data.resources[0].guid,
            'domain_id': res2.data.resources[0].guid
        };
        return results;
    } catch (err) {
        console.log(err.stack);
        return err.message;
    }
};

async function createRoute(subscribedSubdomain, appname) {
    getCFInfo(appname).then(
        async function (CFInfo) {
            try {
                // create route
                let res1 = await httpClient.executeHttpRequest({ destinationName: '<%= projectName %>-cfapi' }, {
                    method: 'POST',
                    url: '/v3/routes',
                    data: {
                        'host': subscribedSubdomain + '-' + process.env.APP_URI.split('.')[0],
                        'relationships': {
                            'space': {
                                'data': {
                                    'guid': appEnv.app.space_id
                                }
                            },
                            'domain': {
                                'data': {
                                    'guid': CFInfo.domain_id
                                }
                            }
                        }
                    },
                });
                // map route to app
                let res2 = await httpClient.executeHttpRequest({ destinationName: '<%= projectName %>-cfapi' }, {
                    method: 'POST',
                    url: '/v3/routes/' + res1.data.guid + '/destinations',
                    data: {
                        'destinations': [{
                            'app': {
                                'guid': CFInfo.app_id
                            }
                        }]
                    },
                });
                console.log('Route created for ' + subscribedSubdomain);
                return res2.data;
            } catch (err) {
                console.log(err.stack);
                return err.message;
            }
        },
        function (err) {
            console.log(err.stack);
            return err.message;
        });
};

async function deleteRoute(subscribedSubdomain, appname) {
    getCFInfo(appname).then(
        async function (CFInfo) {
            try {
                // get route id
                let res1 = await httpClient.executeHttpRequest({ destinationName: '<%= projectName %>-cfapi' }, {
                    method: 'GET',
                    url: '/v3/apps/' + CFInfo.app_id + '/routes?hosts=' + subscribedSubdomain + '-' + process.env.APP_URI.split('.')[0]
                });
                if (res1.data.pagination.total_results === 1) {
                    try {
                        // delete route
                        let res2 = await httpClient.executeHttpRequest({ destinationName: '<%= projectName %>-cfapi' }, {
                            method: 'DELETE',
                            url: '/v3/routes/' + res1.data.resources[0].guid
                        });
                        console.log('Route deleted for ' + subscribedSubdomain);
                        return res2.data;
                    } catch (err) {
                        console.log(err.stack);
                        return err.message;
                    }
                } else {
                    let errmsg = { 'error': 'Route not found' };
                    console.log(errmsg);
                    return errmsg;
                }
            } catch (err) {
                console.log(err.stack);
                return err.message;
            }
        },
        function (err) {
            console.log(err.stack);
            return err.message;
        });
};
<% } else { -%>
const k8s = require('@kubernetes/client-node');

async function createRoute(subscribedSubdomain, appName) {
    try {
        let tenantHost = subscribedSubdomain  + '-<%= projectName %>-app';
        const apiRule = {
            apiVersion: process.env.apiRuleGroup + '/' +  process.env.apiRuleVersion,
            kind: 'APIRule',
            metadata: {
                name: tenantHost,
                labels: {
                    'app.kubernetes.io/managed-by': '<%= projectName %>-srv'
                }
            },
            spec: {
                gateway: process.env.gateway,
                host: tenantHost + '.' + process.env.clusterDomain,
                rules: [
                    {
                        path: '/.*',
                        accessStrategies: [
                            {
                                config: {},
                                handler: 'noop'
                            }
                        ],
                        mutators: [
                            {
                                handler: 'header',
                                config: {
                                    headers: {
                                        "x-forwarded-host": tenantHost + '.' + process.env.clusterDomain
                                    }
                                }
                            }
                        ],
                        methods: [
                            'GET',
                            'POST',
                            'PUT',
                            'PATCH',
                            'DELETE',
                            'HEAD',
                        ]
                    }
                ],
                service: {
                    name: process.env.appServiceName,
                    port: parseInt(process.env.appServicePort)
                }
            }
        };
        const kc = new k8s.KubeConfig();
        kc.loadFromCluster();
        const k8sApi = kc.makeApiClient(k8s.CustomObjectsApi);
        const result = await k8sApi.createNamespacedCustomObject(
            process.env.apiRuleGroup,
            process.env.apiRuleVersion,
            process.env.namespace,
            process.env.apiRules,
            apiRule
        );
        console.log('APIRule created:', appName, subscribedSubdomain, tenantHost, result.response.statusCode, result.response.statusMessage);
        return {};
    } catch (err) {
        console.log(err.stack);
        return err.message;
    }
};

async function deleteRoute(subscribedSubdomain, appName) {
    try {
        let tenantHost = subscribedSubdomain  + '-<%= projectName %>-app';
        const kc = new k8s.KubeConfig();
        kc.loadFromCluster();
        const k8sApi = kc.makeApiClient(k8s.CustomObjectsApi);
        const result = await k8sApi.deleteNamespacedCustomObject(
            process.env.apiRuleGroup,
            process.env.apiRuleVersion,
            process.env.namespace,
            process.env.apiRules,
            tenantHost
        );
        console.log('APIRule deleted:', appName, subscribedSubdomain, tenantHost, result.response.statusCode, result.response.statusMessage);
        return {};
    } catch (err) {
        console.log(err.stack);
        return err.message;
    }
};
<% } -%>
<% } -%>