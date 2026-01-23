const AuditLog = require('../models/AuditLog');

exports.logAction = (action, resource) => {
  return async (req, res, next) => {
    // Log after response is sent
    res.on('finish', async () => {
      try {
        if (req.user) {
          await AuditLog.create({
            user: req.user._id,
            action,
            resource,
            resourceId: req.params.id || req.body._id,
            details: {
              method: req.method,
              url: req.originalUrl,
              body: req.body,
              statusCode: res.statusCode
            },
            ipAddress: req.ip || req.connection.remoteAddress
          });
        }
      } catch (error) {
        console.error('Audit log error:', error);
      }
    });
    next();
  };
};

