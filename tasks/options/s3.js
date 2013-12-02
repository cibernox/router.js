// the base for dist files
var baseDistFile = 'dist/router.';
var builds = ['amd.', '' /* normal rsvp.js */ ];
var s3Uploads = [];
builds.forEach(function(build){
  var srcFile = baseDistFile + build + 'js';
  s3Uploads.push({ src: srcFile, dest: 'router-<%= env.TRAVIS_COMMIT %>.' + build + 'js' });
  s3Uploads.push({ src: srcFile, dest: 'router-latest.' + build + 'js' });
});

module.exports = {
  options: {
    bucket: 'routerjs.builds.emberjs.com',
    access: 'public-read'
  },
  dev: {
    upload: s3Uploads
  }
};

