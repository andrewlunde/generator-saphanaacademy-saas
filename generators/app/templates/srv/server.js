const express = require('express');
const app = express();

const xsenv = require('@sap/xsenv');
xsenv.loadEnv();
const services = xsenv.getServices({
    uaa: { label: 'xsuaa' },
    registry: { label: 'saas-registry' }
<% if(hana){ -%>
    , sm: { label: 'service-manager' }
<% } -%>
<% if(apiDest){ -%>
    , dest: { label: 'destination' }
<% } -%>
});

<% if (apiDest) {-%>
const httpClient = require('@sap-cloud-sdk/http-client');
const { retrieveJwt } = require('@sap-cloud-sdk/connectivity');
<% } -%>

const xssec = require('@sap/xssec');
const passport = require('passport');
passport.use('JWT', new xssec.JWTStrategy(services.uaa));
app.use(passport.initialize());
app.use(passport.authenticate('JWT', {
    session: false
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

<% if(SaaSAPI || hana || routes){ -%>
const lib = require('./library');
<% } -%>

<% if(hana){ -%>
const hdbext = require('@sap/hdbext');
const createInstanceManager = require('@sap/instance-manager').create;
const axios = require('axios');
<% } -%>

// subscribe/onboard a subscriber tenant
app.put('/callback/v1.0/tenants/*', function (req, res) {
    if (!req.authInfo.checkLocalScope('Callback')) {
        console.log('Forbidden: Subscribe requires Callback scope!');
        res.status(403).send('Forbidden');
        return;
    }
<% if(BTPRuntime === 'CF'){ -%>
    let tenantURL = process.env.APP_PROTOCOL + ':\/\/' + req.body.subscribedSubdomain + '-' + process.env.APP_URI;
<% } else { -%>
    let tenantURL = 'https:\/\/' + req.body.subscribedSubdomain + '-<%= projectName %>-app.' + process.env.clusterDomain;
<% } -%>
    console.log('Subscribe:', req.body.subscribedSubdomain, req.body.subscribedTenantId, tenantURL);
<% if(routes){ -%>
    // create route
    lib.createRoute(req.body.subscribedSubdomain, services.registry.appName).then(
        function (result) {
<% } -%>
<% if(hana){ -%>
            // create DB
            createInstanceManager(services.sm, async function (err, serviceManager) {
                if (err) {
                    console.log(err.message);
                    res.status(500).send(err.message);
                    return;
                }
                serviceManager.create(req.body.subscribedTenantId, async function (err, instance) {
                    if (err) {
                        console.log(err.message);
                        res.status(500).send(err.message);
                        return;
                    }
                    console.log('CREATED DB:', req.body.subscribedTenantId, instance.status);
                    // deploy DB artefacts
                    instance.id = req.body.subscribedTenantId;
                    let options = {
                        method: 'POST',
                        data: instance,
                        url: process.env.db_api_url + '/v1/deploy/to/instance',
                        headers: {
                            'Authorization': 'Basic ' + Buffer.from(process.env.db_api_user + ':' + process.env.db_api_password).toString('base64'),
                            'Content-Type': 'application/json'
                        }
                    };
                    try {
                        await axios(options);
                        console.log('DEPLOYED DB:', req.body.subscribedTenantId);
                        res.status(200).send(tenantURL);
                    } catch (err) {
                        console.log(err.message);
                        res.status(500).send(err.message);
                        return err.message;
                    }
                });
            });
<% } else if(routes) { -%>
            res.status(200).send(tenantURL);
<% } -%>
<% if(routes){ -%>
        },
        function (err) {
            console.log(err.stack);
            res.status(500).send(err.message);
        });
<% } -%>
<% if(!routes && !hana){ -%>
    res.status(200).send(tenantURL);
<% } -%>
});

// unsubscribe/offboard a subscriber tenant
app.delete('/callback/v1.0/tenants/*', function (req, res) {
    if (!req.authInfo.checkLocalScope('Callback')) {
        console.log('Forbidden: Unsubscribe requires Callback scope!');
        res.status(403).send('Forbidden');
        return;
    }
    console.log('Unsubscribe:', req.body.subscribedSubdomain, req.body.subscribedTenantId);
<% if(routes){ -%>
    // delete route
    lib.deleteRoute(req.body.subscribedSubdomain, services.registry.appName).then(
        function (result) {
<% } -%>
<% if(hana){ -%>
            // delete DB
            createInstanceManager(services.sm, async function (err, serviceManager) {
                if (err) {
                    console.log(err.message);
                    res.status(500).send(err.message);
                    return;
                }
                serviceManager.delete(req.body.subscribedTenantId, async function (err) {
                    if (err) {
                        console.log(err.message);
                        res.status(500).send(err.message);
                        return;
                    }
                    console.log('DELETED DB:', req.body.subscribedTenantId);
                    res.status(200).send('');
                });
            });
<% } else if(routes) { -%>
            res.status(200).send('');
<% } -%>
<% if(routes){ -%>
        },
        function (err) {
            console.log(err.stack);
            res.status(500).send(err.message);
        });
<% } -%>
<% if(!routes && !hana){ -%>
    res.status(200).send('');
<% } -%>
});

<% if(apiDest){ -%>
// get reuse service dependencies
app.get('/callback/v1.0/dependencies', function (req, res) {
    if (!req.authInfo.checkLocalScope('Callback')) {
        console.log('Forbidden: Dependencies requires Callback scope!');
        res.status(403).send('Forbidden');
        return;
    }
    let dependencies = [{
        'xsappname': services.dest.xsappname
    }];
    console.log('Dependencies:', dependencies);
    res.status(200).json(dependencies);
});
<% } -%>

// app user info
app.get('/srv/info', function (req, res) {
    if (req.authInfo.checkScope('$XSAPPNAME.User')) {
        let info = {
            'userInfo': req.user,
            'subdomain': req.authInfo.getSubdomain(),
            'tenantId': req.authInfo.getZoneId()
        };
        res.status(200).json(info);
    } else {
        res.status(403).send('Forbidden');
    }
});

<% if(SaaSAPI){ -%>
// app subscriptions
app.get('/srv/subscriptions', function (req, res) {
    if (req.authInfo.checkScope('$XSAPPNAME.Admin')) {
        lib.getSubscriptions(services.registry).then(
            function (result) {
                res.status(200).json(result);
            },
            function (err) {
                console.log(err.stack);
                res.status(500).send(err.message);
            });
    } else {
        res.status(403).send('Forbidden');
    }
});
<% } -%>

<% if(hana){ -%>
// app DB
app.get('/srv/database', async function (req, res) {
    if (req.authInfo.checkScope('$XSAPPNAME.User')) {
        // get DB credentials
        createInstanceManager(services.sm, async function (err, serviceManager) {
            if (err) {
                console.log(err.message);
                res.status(500).send(err.message);
                return;
            }
            serviceManager.get(req.authInfo.getZoneId(), async function (err, serviceBinding) {
                if (err) {
                    console.log(err.message);
                    res.status(500).send(err.message);
                    return;
                }
                // connect to DB
                hdbext.createConnection(serviceBinding.credentials, function (err, db) {
                    if (err) {
                        console.log(err.message);
                        res.status(500).send(err.message);
                        return;
                    }
                    // insert
                    let sqlstmt = `INSERT INTO "<%= projectName %>.db::tenantInfo" ("tenant", "timeStamp") VALUES('` + services.registry.appName + `-` + req.authInfo.getSubdomain() + `-` + req.authInfo.getZoneId() + `', CURRENT_TIMESTAMP)`;
                    db.exec(sqlstmt, function (err, results) {
                        if (err) {
                            console.log(err.message);
                            res.status(500).send(err.message);
                            return;
                        }
                        // query
                        sqlstmt = 'SELECT * FROM "<%= projectName %>.db::tenantInfo"';
                        db.exec(sqlstmt, function (err, results) {
                            if (err) {
                                console.log(err.message);
                                res.status(500).send(err.message);
                                return;
                            }
                            res.status(200).json(results);
                        });
                    });
                });
            });
        });
    } else {
        res.status(403).send('Forbidden');
    }
});
<% } -%>

<% if(apiDest){ -%>
// destination reuse service
app.get('/srv/destinations', async function (req, res) {
    if (req.authInfo.checkScope('$XSAPPNAME.User')) {
        try {
            let res1 = await httpClient.executeHttpRequest(
                {
                    destinationName: req.query.destination || '',
                    jwt: retrieveJwt(req)
                },
                {
                    method: 'GET',
                    url: req.query.path || '/'
                }
            );
            res.status(200).json(res1.data);
        } catch (err) {
            console.log(err.stack);
            res.status(500).send(err.message);
        }
    } else {
        res.status(403).send('Forbidden');
    }
});
<% } -%>

const port = process.env.PORT || 5001;
app.listen(port, function () {
    console.info('Listening on http://localhost:' + port);
});