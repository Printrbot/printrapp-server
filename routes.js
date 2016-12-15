module.exports = function(server)
{
    require('./services/auth')(server);
    require('./services/projects')(server);
    require('./services/profile')(server);
    require('./services/printer')(server);
    require('./services/jobs')(server);
    require('./services/thingiverse')(server);
    require('./services/materials')(server);
    require('./services/mmfactory')(server);
}
