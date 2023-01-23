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
// app.use(passport.authenticate('JWT', {
//     session: false
// }));
var PassportAuthenticateMiddleware = passport.authenticate('JWT', {session:false});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


const axios = require('axios');

app.all("*", function (req, res, next) {

    var hostname = "localhost";

    if (((typeof req) == "object") && ((typeof req.headers) == "object") && ((typeof req.headers['x-forwarded-host']) == "string")) {
        hostname = req.headers['x-forwarded-host'];
    }
    console.log("req: " + req.method + " " + hostname + req.url);
    next();

});

// Locally encoded favicon
// https://stackoverflow.com/questions/15463199/how-to-set-custom-favicon-in-express
// make an icon maybe here: http://www.favicon.cc/ or here :http://favicon-generator.org

// convert it to base64 maybe here: http://base64converter.com/

// then replace the icon base 64 value

const favicon = new Buffer.from('AAABAAEAEBAQAAAAAAAoAQAAFgAAACgAAAAQAAAAIAAAAAEABAAAAAAAgAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAA/4QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEREQAAAAAAEAAAEAAAAAEAAAABAAAAEAAAAAAQAAAQAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAEAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAP//AAD8HwAA++8AAPf3AADv+wAA7/sAAP//AAD//wAA+98AAP//AAD//wAA//8AAP//AAD//wAA', 'base64'); 
app.get("/favicon.ico", function(req, res) {
 res.statusCode = 200;
 res.setHeader('Content-Length', favicon.length);
 res.setHeader('Content-Type', 'image/x-icon');
 res.setHeader("Cache-Control", "public, max-age=2592000");                // expiers after a month
 res.setHeader("Expires", new Date(Date.now() + 2592000000).toUTCString());
 res.end(favicon);
});

// app user info
app.get(['/','/noauth','/sqlite/noauth'], function (req, res) {
    var hostname = "localhost";

    if (((typeof req) == "object") && ((typeof req.headers) == "object") && ((typeof req.headers['x-forwarded-host']) == "string")) {
        hostname = req.headers['x-forwarded-host'];
    }
    console.log(req.method + " " + hostname + req.url);
    let info = {
        'noauth': hostname + ":" + req.url
    };
    res.status(200).json(info);
});

app.get("*", PassportAuthenticateMiddleware, function (req, res, next) {

    var hostname = "localhost";

    if (((typeof req) == "object") && ((typeof req.headers) == "object") && ((typeof req.headers['x-forwarded-host']) == "string")) {
        hostname = req.headers['x-forwarded-host'];
    }
    console.log(req.method + " " + hostname + req.url);
    console.log("tenantId: " + req.authInfo.getZoneId());
    // console.log(util.inspect(req.authInfo, {depth: 1}));
    next();

});

// app user info
app.get('/sqlite/info', PassportAuthenticateMiddleware, function (req, res) {
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

<% if(hana){ -%>
// app DB
// app.get('/sqlite/database', async function (req, res) {
//     if (req.authInfo.checkScope('$XSAPPNAME.User')) {
//         // get DB credentials
//         createInstanceManager(services.sm, async function (err, serviceManager) {
//             if (err) {
//                 console.log(err.message);
//                 res.status(500).send(err.message);
//                 return;
//             }
//             serviceManager.get(req.authInfo.getZoneId(), async function (err, serviceBinding) {
//                 if (err) {
//                     console.log(err.message);
//                     res.status(500).send(err.message);
//                     return;
//                 }
//                 // connect to DB
//                 hdbext.createConnection(serviceBinding.credentials, function (err, db) {
//                     if (err) {
//                         console.log(err.message);
//                         res.status(500).send(err.message);
//                         return;
//                     }
//                     // insert
//                     let sqlstmt = `INSERT INTO "<%= projectName %>.db::tenantInfo" ("tenant", "timeStamp") VALUES('` + services.registry.appName + `-` + req.authInfo.getSubdomain() + `-` + req.authInfo.getZoneId() + `', CURRENT_TIMESTAMP)`;
//                     db.exec(sqlstmt, function (err, results) {
//                         if (err) {
//                             console.log(err.message);
//                             res.status(500).send(err.message);
//                             return;
//                         }
//                         // query
//                         sqlstmt = 'SELECT * FROM "<%= projectName %>.db::tenantInfo"';
//                         db.exec(sqlstmt, function (err, results) {
//                             if (err) {
//                                 console.log(err.message);
//                                 res.status(500).send(err.message);
//                                 return;
//                             }
//                             res.status(200).json(results);
//                         });
//                     });
//                 });
//             });
//         });
//     } else {
//         res.status(403).send('Forbidden');
//     }
// });
<% } -%>

<% if(apiDest){ -%>
// destination reuse service
// app.get('/sqlite/destinations', async function (req, res) {
//     if (req.authInfo.checkScope('$XSAPPNAME.User')) {
//         try {
//             let res1 = await httpClient.executeHttpRequest(
//                 {
//                     destinationName: req.query.destination || '',
//                     jwt: retrieveJwt(req)
//                 },
//                 {
//                     method: 'GET',
//                     url: req.query.path || '/'
//                 }
//             );
//             res.status(200).json(res1.data);
//         } catch (err) {
//             console.log(err.stack);
//             res.status(500).send(err.message);
//         }
//     } else {
//         res.status(403).send('Forbidden');
//     }
// });
<% } -%>

const port = process.env.PORT || 5003;
app.listen(port, function () {
    console.info('Listening on http://localhost:' + port);
});