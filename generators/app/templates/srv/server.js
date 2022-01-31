const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const cfenv = require('cfenv');
const appEnv = cfenv.getAppEnv();
const xsenv = require('@sap/xsenv');
//xsenv.loadEnv();
const services = xsenv.getServices({
    uaa: { tag: 'xsuaa' },
    registry: { tag: 'SaaS' }
<% if(HANA){ -%>
    , sm: { label: 'service-manager' }
<% } -%>
<% if(destination){ -%>
    , dest: { tag: 'destination' }
<% } -%>
});

<% if (destination) {-%>
const CloudSDKCore = require('@sap-cloud-sdk/core');
<% } -%>

const xssec = require('@sap/xssec');
const passport = require('passport');
passport.use('JWT', new xssec.JWTStrategy(services.uaa));
app.use(passport.initialize());
app.use(passport.authenticate('JWT', {
    session: false
}));

app.use(bodyParser.json());

<% if(SaaSAPI || HANA || routes){ -%>
const lib = require('./library');
<% } -%>

<% if(HANA){ -%>
const hdbext = require('@sap/hdbext');
<% } -%>

// subscribe/onboard a subscriber tenant
app.put('/callback/v1.0/tenants/*', function (req, res) {
<% if(customDomain !== ""){ -%>
    let tenantHost = req.body.subscribedSubdomain;
<% } else { -%>
    let tenantHost = req.body.subscribedSubdomain + '-' + appEnv.app.space_name.toLowerCase().replace(/_/g, '-') + '-' + services.registry.appName.toLowerCase().replace(/_/g, '-');
<% } -%>
    let tenantURL = 'https:\/\/' + tenantHost + /\.(.*)/gm.exec(appEnv.app.application_uris[0])[0];
    console.log('Subscribe: ', req.body.subscribedSubdomain, req.body.subscribedTenantId, tenantHost, tenantURL);
<% if(routes){ -%>
    lib.createRoute(tenantHost, services.registry.appName).then(
        function (result) {
<% } -%>
<% if(HANA){ -%>
            lib.createSMInstance(services.sm, services.registry.appName + '-' + req.body.subscribedTenantId).then(
                async function (result) {
                    res.status(200).send(tenantURL);
                },
                function (err) {
                    console.log(err.stack);
                    res.status(500).send(err.message);
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
<% if(!routes && !HANA){ -%>
    res.status(200).send(tenantURL);
<% } -%>
});

// unsubscribe/offboard a subscriber tenant
app.delete('/callback/v1.0/tenants/*', function (req, res) {
<% if(customDomain !== ""){ -%>
    let tenantHost = req.body.subscribedSubdomain;
<% } else { -%>
    let tenantHost = req.body.subscribedSubdomain + '-' + appEnv.app.space_name.toLowerCase().replace(/_/g, '-') + '-' + services.registry.appName.toLowerCase().replace(/_/g, '-');
<% } -%>
    console.log('Unsubscribe: ', req.body.subscribedSubdomain, req.body.subscribedTenantId, tenantHost);
<% if(routes){ -%>
    lib.deleteRoute(tenantHost, services.registry.appName).then(
        function (result) {
<% } -%>
<% if(HANA){ -%>
            lib.deleteSMInstance(services.sm, services.registry.appName + '-' + req.body.subscribedTenantId).then(
                function (result) {
                    res.status(200).send('');
                },
                function (err) {
                    console.log(err.stack);
                    res.status(500).send(err.message);
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
<% if(!routes && !HANA){ -%>
    res.status(200).send('');
<% } -%>
});

<% if(destination){ -%>
// get reuse service dependencies
app.get('/callback/v1.0/dependencies', function (req, res) {
    let tenantId = req.params.tenantId;
    let dependencies = [{
        'xsappname': services.dest.xsappname
    }];
    console.log('Dependencies: ', tenantId, dependencies);
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
    if (req.authInfo.checkScope('$XSAPPNAME.Administrator')) {
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

<% if(HANA){ -%>
// app database
app.get('/srv/database', function (req, res) {
    if (req.authInfo.checkScope('$XSAPPNAME.User')) {
        // get DB instance
        lib.getSMInstance(services.sm, services.registry.appName + '-' + req.authInfo.getZoneId()).then(
            function (serviceBinding) {
                if (!serviceBinding.hasOwnProperty('error')) {
                    // connect to DB instance
                    let hanaOptions = serviceBinding.credentials;
                    hdbext.createConnection(hanaOptions, function (err, db) {
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
                } else {
                    res.status(500).send(serviceBinding);
                }
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

<% if(destination){ -%>
// destination reuse service
app.get('/srv/destinations', async function (req, res) {
    if (req.authInfo.checkScope('$XSAPPNAME.User')) {
        try {
            let res1 = await CloudSDKCore.executeHttpRequest(
                {
                    destinationName: req.query.destination,
                    jwt: req.headers.authorization.split(" ")[1]
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
