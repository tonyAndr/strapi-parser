module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 7248),
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET', 'a0dc36d76231a00f6868f0a691c1bfcc'),
    },
  },
  cron: {
    enabled: true
  }
});
