var join = require('path').join;
var crypto = require('crypto');

exports.urlSigner = function(key, secret, options){
  options = options || {};
  var endpoint = options.host || 's3.amazonaws.com';
  var port = options.port || '80';
  var protocol = options.protocol || 'http';
  var subdomain = options.useSubdomain === true;

  var hmacSha1 = function (message) {
    return crypto.createHmac('sha1', secret)
                  .update(message)
                  .digest('base64');
  };

  var url = function (fname, bucket) {
      if (subdomain) {
        return protocol + '://'+ bucket + "." + endpoint + (port != 80 ? ':' + port : '') + (fname[0] === '/'?'':'/') + fname;
      } else {
        return protocol + '://'+ endpoint + (port != 80 ? ':' + port : '') + '/' + bucket + (fname[0] === '/'?'':'/') + fname;
      }
  };

  return {
    getUrl : function(verb, fname, bucket, expiresInMinutes, download){
      var expires = new Date();

      expires.setMinutes(expires.getMinutes() + expiresInMinutes);

      var epo = Math.floor(expires.getTime()/1000);

      var ext = fname.split('.').pop();
      var str = verb + '\n\n\n' + epo + '\n' + '/' + bucket + (fname[0] === '/'?'':'/') + fname;

      if (download) {
        str += '?response-content-type=application/octet-stream';
      }

      var hashed = hmacSha1(str);

      var urlRet = url(fname, bucket) +
        '?Expires=' + epo +
        '&AWSAccessKeyId=' + key +
        '&Signature=' + encodeURIComponent(hashed);

      if (download) {
        urlRet += '&response-content-type=application/octet-stream';
      }

      return urlRet;

    }
  };

};
