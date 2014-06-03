/**
 *  @license
 *  jsOAuth version 1.4.0so1
 *  Copyright (c) 2010, 2011 Rob Griffiths (http://bytespider.eu)
 *  jsOAuth is freely distributable under the terms of an MIT-style license.
 */
var exports = exports || this;
exports.OAuth = (function (global) {

    /** signed.applets.codebase_principal_support to enable support in Firefox **/

    function List() {}

    List.prototype = [];
    List.superclass = Array.prototype;
    List.prototype.constructor = List;

    List.prototype.copy = function() {
        var list = new this.constructor();

        this.forEach(function(value, i) {
            if (typeof value.copy === 'function') {
                value = value.copy();
            }
            list.push(value);
        });

        return list;
    };

    List.prototype.concat = function() {
        var list = this.copy(), i, j, len;

        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] instanceof Array) {
                for (j = 0, len = arguments[i].length; j < len; j++) {
                    list.push(arguments[i][j]);
                }
            } else {
                list.push(arguments[i]);
            }
        }

        return list;
    };

    List.prototype.getFirst = function() {
        var value = null;

        if (this.length > 0) {
            value = this[0];
        }

        return value;
    };

    if (typeof List.prototype.forEach !== 'function') {
        List.prototype.forEach = function(callback, scope) {
            var i, len;
            for (i = 0, len = this.length; i < len; ++i) {
                if (i in this) {
                    callback.call(scope, this[i], i, this);
                }
            }
            return this;
        }
    };
    function Param(name, value) {
        var args = arguments, args_callee = args.callee, args_length = args.length,
            i, param = this;

        if (!(this instanceof args_callee)) {
            return new args_callee(name, value);
        }

        if (name instanceof Array && name.length === 2) {
            param.name  = name[0] + '';
            param.value = name[1] + '';
        } else if (name !== undefined) {
            param.name = name;
            if (value === undefined) {
                param.value = '';
            } else {
                param.value = value;
            }
        }

        return param;
    }

    Param.prototype.copy = function() {
        return new Param(this.name, this.value);
    };

    Param.prototype.toString = function() {
        var encode = OAuth.urlEncode;
        return encode(this.name) + '=' + encode(this.value);
    };
    function ParamList(arr) {
        ParamList.superclass.constructor.call(this, arr);

        var args = arguments, args_callee = args.callee, i, paramlist = this;

        if (!(this instanceof args_callee)) {
            return new args_callee(arr);
        }

        if (arr instanceof ParamList) {
            arr.forEach(function(param) {
                paramlist.push(param);
            });
        } else if (arr instanceof Array) {
            for (i = 0; i < arr.length; i++) {
                if (arr[i] instanceof Array && arr[i].length === 2) {
                    paramlist.push(new Param(arr[i][0], arr[i][1]));
                }
            }
        }

        return paramlist;
    }

    // ParamList is a type of list So inherit
    ParamList.prototype = new List();
    ParamList.superclass = List.prototype;
    ParamList.prototype.constructor = ParamList;

    ParamList.prototype.getByNameInsensitive = function(name) {
        var list = new this.constructor();

        this.forEach(function(param) {
            if (param.name.toLowerCase() === name.toLowerCase()) {
                list.push(param);
            }
        });

        return list;
    };

    ParamList.prototype.getByName = function(name) {
        var list = new this.constructor();

        this.forEach(function(param) {
            if (param.name === name) {
                list.push(param);
            }
        });

        return list;
    };

    ParamList.prototype.sort = function(fn) {

        // default to byte-order sorting of names and then values
        if (typeof fn === 'undefined') {
            fn = function(a, b) {
                if (a.name < b.name) {
                    return -1;
                }
                if (a.name > b.name) {
                    return 1;
                }
                if (a.value < b.value) {
                    return -1;
                }
                if (a.value > b.value) {
                    return 1;
                }
                return 0;
            };
        }

        return ParamList.superclass.sort.call(this, fn);
    };

    ParamList.prototype.removeByName = function(name) {
        var i, length = this.length;
        for (i = 0; i < length; i++) {
            if (this[i].name === name) {
                this.splice(i, 1);
                i--;
                length--;
            }
        }
        return this;
    };

    ParamList.prototype.toString = function () {
        var q_arr = [], ret = '';

        this.sort().forEach(function(param) {
            q_arr.push(param + '');
        });

        if (q_arr.length > 0) {
            ret = q_arr.join('&');
        }

        return ret;
    };

    ParamList.prototype.toJSON = function() {
        var q_arr = [];

        this.forEach(function(param) {
            q_arr.push([ param.name, param.value ]);
        });

        return q_arr;
    };
    /**
     * Url
     *
     * @constructor
     * @param {String} url
     */
    function URI(url) {
        var args = arguments, args_callee = args.callee,
            parsed_uri, scheme, host, port, path, query, anchor,
            parser = /^([^:\/?#]+?:\/\/)*([^\/:?#]*)?(:[^\/?#]*)*([^?#]*)(\?[^#]*)?(#(.*))*/,
            uri = this;

        if (!(this instanceof args_callee)) {
            return new args_callee(url);
        }

        uri.scheme = '';
        uri.host = '';
        uri.port = '';
        uri.path = '';
        uri.query = new QueryString();
        uri.anchor = '';

        if (url !== null) {
            parsed_uri = url.match(parser);

            scheme = parsed_uri[1];
            host = parsed_uri[2];
            port = parsed_uri[3];
            path = parsed_uri[4];
            query = parsed_uri[5];
            anchor = parsed_uri[6];

            scheme = (scheme !== undefined) ? scheme.replace('://', '').toLowerCase() : 'http';
            port = (port ? port.replace(':', '') : (scheme === 'https' ? '443' : '80'));
            // correct the scheme based on port number
            scheme = (scheme == 'http' && port === '443' ? 'https' : scheme);
            query = query ? query.replace('?', '') : '';
            anchor = anchor ? anchor.replace('#', '') : '';


            // Fix the host name to include port if non-standard ports were given
            if ((scheme === 'https' && port !== '443') || (scheme === 'http' && port !== '80')) {
                host = host + ':' + port;
            }

            uri.scheme = scheme;
            uri.host = host;
            uri.port = port;
            uri.path = path || '/';
            uri.query.setQueryParams(query);
            uri.anchor = anchor || '';
        }
    }

    URI.prototype = {
        scheme: '',
        host: '',
        port: '',
        path: '',
        query: '',
        anchor: '',
        toString: function () {
            var self = this, query = self.query + '';
            return self.scheme + '://' + self.host + self.path + (query != '' ? '?' + query : '') + (self.anchor !== '' ? '#' + self.anchor : '');
        }
    };

    /**
     * Create and manage a query string
     *
     * @param {Object} obj
     */
    function QueryString(arr) {
        QueryString.superclass.constructor.call(this, arr);
    }

    // QueryString is a type of param list, so inherit
    QueryString.prototype = new ParamList();
    QueryString.superclass = ParamList.prototype;
    QueryString.prototype.constructor = QueryString;

    /**
     *
     * @param {Object} query
     */
    QueryString.prototype.setQueryParams = function (query) {
        var args = arguments, args_length = args.length, i, query_array,
            query_array_length, querystring = this, key_value, decode = OAuth.urlDecode;

        if (args_length === 1) {
            if (typeof query === 'object') {
                if (query instanceof Array) {
                    // iterate array
                    for (i = 0; i < query.length; i++) {
                        if (query[i] instanceof Array && query[i].length === 2) {
                            querystring.push(
                                new Param(
                                    query[i][0],
                                    query[i][1]
                                )
                            );
                        }
                    }
                } else if (query instanceof ParamList) {
                    querystring = query.copy();
                } else {
                    // iterate object
                    for (i in query) {
                        if (query.hasOwnProperty(i)) {
                            querystring.push(
                                new Param(
                                    i,
                                    query[i]
                                )
                            );
                        }
                    }
                }
            } else if (typeof query === 'string') {
                // split string on '&'
                query_array = query.split('&');
                // iterate over each of the array items
                for (i = 0, query_array_length = query_array.length; i < query_array_length; i++) {
                    // split on '=' to get key, value
                    key_value = query_array[i].split('=');
                    if (key_value[0] !== '') {
                        querystring.push(
                            new Param(
                                decode(key_value[0]),
                                decode(key_value[1])
                            )
                        );
                    }
                }
            }
        } else {
            for (i = 0; i < args_length; i += 2) {
                // treat each arg as key, then value
                querystring.push(
                    new Param(
                        args[i],
                        args[i + 1]
                    )
                );
            }
        }
    };

    /** @const */ var OAUTH_VERSION_1_0 = '1.0';

    /**
     * OAuth
     *
     * @constructor
     */
    function OAuth(options) {
        if (!(this instanceof OAuth)) {
            return new OAuth(options);
        }

        return this.init(options);
    }

    OAuth.prototype = {
        realm: '',
        requestTokenUrl: '',
        authorizationUrl: '',
        accessTokenUrl: '',

        init: function (options) {
            var empty = '';
            var oauth = {
                enablePrivilege: options.enablePrivilege || false,

                proxy: options.proxy,
                proxyUrl: options.proxyUrl,
                callbackUrl: options.callbackUrl || 'oob',

                consumerKey: options.consumerKey,
                consumerSecret: options.consumerSecret,
                accessTokenKey: options.accessTokenKey || empty,
                accessTokenSecret: options.accessTokenSecret || empty,
                verifier: empty,
                signatureMethod: options.signatureMethod || 'HMAC-SHA1'
            };

            this.realm = options.realm || empty;
            this.requestTokenUrl = options.requestTokenUrl || empty;
            this.authorizationUrl = options.authorizationUrl || empty;
            this.accessTokenUrl = options.accessTokenUrl || empty;

            this.getAccessToken = function () {
                return [oauth.accessTokenKey, oauth.accessTokenSecret];
            };

            this.getAccessTokenKey = function () {
                return oauth.accessTokenKey;
            };

            this.getAccessTokenSecret = function () {
                return oauth.accessTokenSecret;
            };

            this.setAccessToken = function (tokenArray, tokenSecret) {
                if (tokenSecret) {
                    tokenArray = [tokenArray, tokenSecret];
                }
                oauth.accessTokenKey = tokenArray[0];
                oauth.accessTokenSecret = tokenArray[1];
            };

            this.getVerifier = function () {
                return oauth.verifier;
            };

            this.setVerifier = function (verifier) {
                oauth.verifier = verifier;
            };

            this.setCallbackUrl = function (url) {
                oauth.callbackUrl = url;
            };

            /**
             * Makes an authenticated http request
             *
             * @param options {object}
             *      method {string} ['GET', 'POST', 'PUT', ...]
             *      url {string} A valid http(s) url
             *      data {ParamList} A list of of data. For GET this will append a query string.
             *      headers {ParamList} A list of additional headers.
             *      success {function} callback for a sucessful request
             *      failure {function} callback for a failed request
             */
            this.request = function (options) {
                var method, url, data, headers, success, failure, xhr, i,
                    headerParams, signatureMethod, signatureString, signature,
                    query = [], appendQueryString, signatureData = new ParamList(), params, withFile, urlString,
                    contentType;

                method = options.method || 'GET';
                url = URI(options.url);
                data = (options.data) ? new ParamList(options.data) : new ParamList();
                headers = (options.headers) ? new ParamList(options.headers) : new ParamList();
                success = options.success || function () {};
                failure = options.failure || function () {};

                // According to the spec
                withFile = (function(){
                    var hasFile = false;

                    if (data instanceof List) {
                        data.forEach(function(param) {
                            // Thanks to the FileAPI any file entry
                            // has a fileName property
                            if (param.value instanceof File || typeof param.value.fileName !== 'undefined') {
                                hasFile = true;
                                return true;
                            }
                        });
                    }

                    return hasFile;
                })();

                appendQueryString = options.appendQueryString ? options.appendQueryString : false;

                if (oauth.enablePrivilege) {
                    netscape.security.PrivilegeManager.enablePrivilege('UniversalBrowserRead UniversalBrowserWrite');
                }

                xhr = Request();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        var regex = /^(.*?):\s*(.*?)\r?$/mg,
                            requestHeaders = headers,
                            responseHeaders = new ParamList(),
                            responseHeadersString = '',
                            match;

                        if (!!xhr.getAllResponseHeaders) {
                            responseHeadersString = xhr.getAllResponseHeaders();
                            while((match = regex.exec(responseHeadersString))) {
                                responseHeaders.push(new Param(match[1], match[2]));
                            }
                        } else if (!!xhr.getResponseHeaders) {
                            responseHeadersString = xhr.getResponseHeaders();
                            for (var i = 0, len = responseHeadersString.length; i < len; ++i) {
                                responseHeaders.push(
                                    new Param(
                                        responseHeadersString[i][0],
                                        responseHeadersString[i][1]
                                    )
                                );
                            }
                        }

                        var includeXML = false;
                        var contentType = responseHeaders.getByNameInsensitive('Content-Type').getFirst();
                        if (contentType && contentType.value === 'text/xml') {
                            includeXML = true;
                        }

                        var responseObject = {
                            text: xhr.responseText,
                            xml: (includeXML ? xhr.responseXML : ''),
                            requestHeaders: requestHeaders,
                            responseHeaders: responseHeaders
                        };

                        // we are powerless against 3xx redirects
                        if((xhr.status >= 200 && xhr.status <= 226) || xhr.status == 304 || xhr.status === 0) {
                            success(responseObject);
                        // everything what is 400 and above is a failure code
                        } else if(xhr.status >= 400 && xhr.status !== 0) {
                            failure(responseObject);
                        }
                    }
                };

                headerParams = new ParamList([
                    [ 'oauth_callback', oauth.callbackUrl ],
                    [ 'oauth_consumer_key', oauth.consumerKey ],
                    [ 'oauth_token', oauth.accessTokenKey ],
                    [ 'oauth_signature_method', oauth.signatureMethod ],
                    [ 'oauth_timestamp', getTimestamp() ],
                    [ 'oauth_nonce', getNonce() ],
                    [ 'oauth_verifier', oauth.verifier ],
                    [ 'oauth_version', OAUTH_VERSION_1_0 ]
                ]);

                signatureMethod = oauth.signatureMethod;

                // Handle GET params first
                signatureData = signatureData.concat(url.query);

                // According to the OAuth spec
                // if data is transfered using
                // multipart the POST data doesn't
                // have to be signed:
                // http://www.mail-archive.com/oauth@googlegroups.com/msg01556.html
                contentType = headers.getByNameInsensitive('Content-Type').getFirst();
                if ((!contentType || contentType.value.toLowerCase() === 'application/x-www-form-urlencoded') && !withFile) {
                    signatureData = signatureData.concat(data);
                }

                urlString = url.scheme + '://' + url.host + url.path;
                signatureString = toSignatureBaseString(method, urlString, headerParams, signatureData);

                signature = OAuth.signatureMethod[signatureMethod](oauth.consumerSecret, oauth.accessTokenSecret, signatureString);

                headerParams.push(new Param('oauth_signature', signature));

                if (this.realm) {
                    headerParams.push(new Param('realm', this.realm));
                }

                if (oauth.proxy) {
                    if (typeof oauth.proxy == 'function') {
                        url = URI(oauth.proxy(url.path, url.query));
                    } else if(url.query != '') {
                        url = URI(oauth.proxy + url.path + '?' + url.query);
                    } else {
                        url = URI(oauth.proxy + url.path);
                    }
                } else if (oauth.proxyUrl) {
                    url = URI(oauth.proxyUrl + url.path);
                }

                if (appendQueryString || method === 'GET') {
                    url.query.setQueryParams(data);
                    query = null;
                } else if (!withFile){
                    if (typeof data === 'string') {
                        query = data;
                        if (!contentType) {
                            headers.push(new Param('Content-Type', 'text/plain'));
                        }
                    } else {
                        query = data.copy().sort().join('&');
                        if (!contentType) {
                            headers.push(new Param('Content-Type', 'application/x-www-form-urlencoded'));
                        }
                    }
                } else if (withFile) {
                    // When using FormData multipart content type
                    // is used by default and required header
                    // is set to multipart/form-data etc
                    query = new FormData();
                    data.forEach(function(param) {
                        query.append(param.name, param.value);
                    });
                }

                xhr.open(method, url+'', true);

                xhr.setRequestHeader('Authorization', 'OAuth ' + toHeaderString(headerParams));
                xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');

                headers.forEach(function(param) {
                    xhr.setRequestHeader(param.name, param.value);
                });

                xhr.send(query);
            };

            return this;
        },

        /**
         * Wrapper for GET OAuth.request
         *
         * @param url {string} vaild http(s) url
         * @param success {function} callback for a successful request
         * @param failure {function} callback for a failed request
         */
        get: function (url, success, failure) {
            this.request({'url': url, 'success': success, 'failure': failure});
        },

        /**
         * Wrapper for POST OAuth.request
         *
         * @param url {string} vaild http(s) url
         * @param data {object} A key value paired object of data
         *                      example: {'q':'foobar'}
         *                      for GET this will append a query string
         * @param success {function} callback for a successful request
         * @param failure {function} callback for a failed request
         */
        post: function (url, data, success, failure) {
            this.request({'method': 'POST', 'url': url, 'data': data, 'success': success, 'failure': failure});
        },

        /**
         * Wrapper to parse a JSON string and pass it to the callback
         *
         * @param url {string} vaild http(s) url
         * @param success {function} callback for a successful request
         * @param failure {function} callback for a failed request
         */
        getJSON: function (url, success, failure) {
            this.get(url, function (data) {
                success(JSON.parse(data.text));
            }, failure);
        },

        /**
         * Wrapper to parse a JSON string and pass it to the callback
         *
         * @param url {string} vaild http(s) url
         * @param success {function} callback for a successful request
         * @param failure {function} callback for a failed request
         */
        postJSON: function (url, data, success, failure) {
            this.request({
                'method': 'POST',
                'url': url,
                'data': JSON.stringify(data),
                'success': function (data) {
                    success(JSON.parse(data.text));
                },
                'failure': failure,
                'headers': [
                    [ 'Content-Type', 'application/json' ]
                ]
            });
        },

        parseTokenRequest: function (tokenRequest, content_type) {
            var obj;

            switch(content_type)
            {
                case "text/xml":
                    var token = tokenRequest.xml.getElementsByTagName('token');
                    var secret = tokenRequest.xml.getElementsByTagName('secret');

                    obj = {
                        'oauth_token' : OAuth.urlDecode(token[0]),
                        'oauth_token_secret' : OAuth.urlDecode(secret[0])
                    };

                    break;

                default:
                    var i = 0, arr = tokenRequest.text.split('&'), len = arr.length;

                    obj = {};
                    for (; i < len; ++i) {
                        var pair = arr[i].split('=');
                        obj[OAuth.urlDecode(pair[0])] = OAuth.urlDecode(pair[1]);
                    }

                    break;
            }


            return obj;
        },

        fetchRequestToken: function (success, failure) {
            var oauth = this;
            oauth.setAccessToken('', '');

            var url = oauth.authorizationUrl;
            this.get(this.requestTokenUrl, function (data) {
                var token = oauth.parseTokenRequest(data, data.responseHeaders['Content-Type'] || undefined);
                oauth.setAccessToken([token.oauth_token, token.oauth_token_secret]);
                success(url + '?' + data.text);
            }, failure);
        },

        fetchAccessToken: function (success, failure) {
            var oauth = this;
            this.get(this.accessTokenUrl, function (data) {
                var token = oauth.parseTokenRequest(data, data.responseHeaders['Content-Type'] || undefined);
                oauth.setAccessToken([token.oauth_token, token.oauth_token_secret]);

                // clean up a few un-needed things
                oauth.setVerifier('');

                success(data);
            }, failure);
        }
    };

    OAuth.signatureMethod = {
        /**
         * Sign the request
         *
         * @param consumer_secret {string} the consumer secret
         * @param token_secret {string}  the token secret
         * @param signature_base {string}  the signature base string
         */
        'HMAC-SHA1': function (consumer_secret, token_secret, signature_base) {
            var passphrase, signature, encode = OAuth.urlEncode;

            consumer_secret = encode(consumer_secret);
            token_secret = encode(token_secret || '');

            passphrase = consumer_secret + '&' + token_secret;
            signature = HMAC(SHA1.prototype, passphrase, signature_base);

            return global.btoa(signature);
        }
    };

    /**
     * Get a string of the parameters for the OAuth Authorization header
     *
     * @param params {ParamList} A list of data.
     */
    function toHeaderString(params) {
        var list = new ParamList(), i, realm, encode = OAuth.urlEncode, arr = [];

        params.forEach(function(param) {
            if (param.value !== '') {
                if (param.name.toLowerCase() === 'realm') {
                    realm = encode(param.name) + '="' + encode(param.value) + '"'
                } else {
                    list.push(
                        new Param(
                            param.name,
                            param.value
                        )
                    );
                }
            }
        });

        // encode sorted list
        list.sort().forEach(function(param) {
            arr.push(encode(param.name) + '="' + encode(param.value) + '"');
        });

        // add realm to start
        if (realm) {
            arr.unshift(realm);
        }

        return arr.join(', ');
    }

    /**
     * Generate a signature base string for the request
     *
     * @param method {string} ['GET', 'POST', 'PUT', ...]
     * @param url {string} A valid http(s) url
     * @param header_params {ParamList} List of additional headers
     * @param query_params {ParamList} List of POST data or query parameters.
     */
    function toSignatureBaseString(method, url, header_params, query_params) {
        var list = new ParamList(), i, encode = OAuth.urlEncode, noEmpty = new ParamList();

        list = list.concat(header_params).concat(query_params);

        list.removeByName('oauth_signature');

        list.sort().forEach(function(param) {
            if (param.value !== '') {
                noEmpty.push(param);
            }
        });

        return [
            method,
            encode(url),
            encode(noEmpty.join('&'))
        ].join('&');
    }

    /**
     * Generate a timestamp for the request
     */
    function getTimestamp() {
        return parseInt(+new Date() / 1000, 10); // use short form of getting a timestamp
    }

    /**
     * Generate a nonce for the request
     *
     * @param key_length {number} Optional nonce length
     */
    function getNonce(key_length) {
        function rand() {
            return Math.floor(Math.random() * chars.length);
        }

        key_length = key_length || 64;

        var key_bytes = key_length / 8, value = '', key_iter = key_bytes / 4,
        key_remainder = key_bytes % 4, i,
        chars = ['20', '21', '22', '23', '24', '25', '26', '27', '28', '29',
                     '2A', '2B', '2C', '2D', '2E', '2F', '30', '31', '32', '33',
                     '34', '35', '36', '37', '38', '39', '3A', '3B', '3C', '3D',
                     '3E', '3F', '40', '41', '42', '43', '44', '45', '46', '47',
                     '48', '49', '4A', '4B', '4C', '4D', '4E', '4F', '50', '51',
                     '52', '53', '54', '55', '56', '57', '58', '59', '5A', '5B',
                     '5C', '5D', '5E', '5F', '60', '61', '62', '63', '64', '65',
                     '66', '67', '68', '69', '6A', '6B', '6C', '6D', '6E', '6F',
                     '70', '71', '72', '73', '74', '75', '76', '77', '78', '79',
                     '7A', '7B', '7C', '7D', '7E'];

        for (i = 0; i < key_iter; i++) {
            value += chars[rand()] + chars[rand()] + chars[rand()]+ chars[rand()];
        }

        // handle remaing bytes
        for (i = 0; i < key_remainder; i++) {
            value += chars[rand()];
        }

        return value;
    }

    /**
     * rfc3986 compatable encode of a string
     *
     * @param {String} string
     */
    OAuth.urlEncode = function (string) {
        function hex(code) {
            var hex = code.toString(16).toUpperCase();
            if (hex.length < 2) {
                hex = 0 + hex;
            }
            return '%' + hex;
        }

        if (!string) {
            return '';
        }

        string = string + '';
        var reserved_chars = /[ \t\r\n!*"'();:@&=+$,\/?%#\[\]<>{}|`^\\\u0080-\uffff]/,
            str_len = string.length, i, string_arr = string.split(''), c;

        for (i = 0; i < str_len; i++) {
            if (c = string_arr[i].match(reserved_chars)) {
                c = c[0].charCodeAt(0);

                if (c < 128) {
                    string_arr[i] = hex(c);
                } else if (c < 2048) {
                    string_arr[i] = hex(192+(c>>6)) + hex(128+(c&63));
                } else if (c < 65536) {
                    string_arr[i] = hex(224+(c>>12)) + hex(128+((c>>6)&63)) + hex(128+(c&63));
                } else if (c < 2097152) {
                    string_arr[i] = hex(240+(c>>18)) + hex(128+((c>>12)&63)) + hex(128+((c>>6)&63)) + hex(128+(c&63));
                }
            }
        }

        return string_arr.join('');
    };

    /**
     * rfc3986 compatable decode of a string
     *
     * @param {String} string
     */
    OAuth.urlDecode = function (string){
        if (!string) {
            return '';
        }

        return string.replace(/%[a-fA-F0-9]{2}/ig, function (match) {
            return String.fromCharCode(parseInt(match.replace('%', ''), 16));
        });
    };
    /**
     * Factory object for XMLHttpRequest
     */
    function Request() {
        var XHR;


        if (typeof global.Titanium !== 'undefined' && typeof global.Titanium.Network.createHTTPClient != 'undefined') {
            XHR = global.Titanium.Network.createHTTPClient();
        } else if (typeof require !== 'undefined') {
            // CommonJS require
            try {
                XHR = new require("xhr").XMLHttpRequest();
            } catch (e) {
                // module didn't expose correct API or doesn't exists
                if (typeof global.XMLHttpRequest !== "undefined") {
                    XHR = new global.XMLHttpRequest();
                } else {
                    throw "No valid request transport found.";
                }
            }
        } else if (typeof global.XMLHttpRequest !== "undefined") {
            // W3C
            XHR = new global.XMLHttpRequest();
        } else {
            throw "No valid request transport found.";
        }

        return XHR;
    }
    function zeroPad(length) {
        var arr = new Array(++length);
        return arr.join(0).split('');
    }

    function stringToByteArray(str) {
        var bytes = [], code, i;

        for(i = 0; i < str.length; i++) {
            code = str.charCodeAt(i);

            if (code < 128) {
                bytes.push(code);
            } else if (code < 2048) {
                bytes.push(192+(code>>6), 128+(code&63));
            } else if (code < 65536) {
                bytes.push(224+(code>>12), 128+((code>>6)&63), 128+(code&63));
            } else if (code < 2097152) {
                bytes.push(240+(code>>18), 128+((code>>12)&63), 128+((code>>6)&63), 128+(code&63));
            }
        }

        return bytes;
    }

    function wordsToByteArray(words) {
        var bytes = [], i;
        for (i = 0; i < words.length * 32; i += 8) {
            bytes.push((words[i >>> 5] >>> (24 - i % 32)) & 255);
        }
        return bytes;
    }

    function byteArrayToHex(byteArray) {
        var hex = [], l = byteArray.length, i;
        for (i = 0; i < l; i++) {
            hex.push((byteArray[i] >>> 4).toString(16));
            hex.push((byteArray[i] & 0xF).toString(16));
        }
        return hex.join('');
    }

    function byteArrayToString(byteArray) {
        var string = '', l = byteArray.length, i;
        for (i = 0; i < l; i++) {
            string += String.fromCharCode(byteArray[i]);
        }
        return string;
    }

    function leftrotate(value, shift) {
        return (value << shift) | (value >>> (32 - shift));
    }

    function SHA1(message) {
        if (message !== undefined) {
            var m = message, crypto, digest;
            if (m.constructor === String) {
                m = stringToByteArray(m);
            }

            if (!(this instanceof SHA1)) {
                crypto =  new SHA1(message);
            } else {
                crypto = this;
            }
            digest = crypto.hash(m);

            return byteArrayToHex(digest);
        } else {
            if (!(this instanceof SHA1)) {
                return new SHA1();
            }
        }

        return this;
    }

    SHA1.prototype = new SHA1();
    SHA1.prototype.blocksize = 64;
    SHA1.prototype.hash = function (m) {
        var H = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0],
            K = [0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xCA62C1D6],
            lb, hb,
            l, pad, ml, blocks, b, block, bl, w, i, A, B, C, D, E, t, n, TEMP;

        function fn(t, B, C, D) {
            switch (t) {
                case 0:
                    return (B & C) | ((~B) & D);
                case 1:
                case 3:
                    return B ^ C ^ D;
                case 2:
                    return (B & C) | (B & D) | (C & D);
            }

            return -1;
        }


        if (m.constructor === String) {
            m = stringToByteArray(m.encodeUTF8());
        }

        l = m.length;

        pad = (Math.ceil((l + 9) / this.blocksize) * this.blocksize) - (l + 9);

        hb = (Math.floor(l / 4294967296));
        lb = (Math.floor(l % 4294967296));

        ml = [
            ((hb * 8) >> 24) & 255,
            ((hb * 8) >> 16) & 255,
            ((hb * 8) >> 8) & 255,
            (hb * 8) & 255,
            ((lb * 8) >> 24) & 255,
            ((lb * 8) >> 16) & 255,
            ((lb * 8) >> 8) & 255,
            (lb * 8) & 255
        ];

        m = m.concat([0x80], zeroPad(pad), ml);

        blocks = Math.ceil(m.length / this.blocksize);

        for (b = 0; b < blocks; b++) {
            block = m.slice(b * this.blocksize, (b+1) * this.blocksize);
            bl = block.length;

            w = [];

            for (i = 0; i < bl; i++) {
                w[i >>> 2] |= block[i] << (24 - (i - ((i >> 2) * 4)) * 8);
            }

            A = H[0];
            B = H[1];
            C = H[2];
            D = H[3];
            E = H[4];

            for (t=0; t < 80; t++) {
            if (t >= 16) {
                w[t] = leftrotate(w[t-3] ^ w[t-8] ^ w[t-14] ^ w[t-16], 1);
            }

            n = Math.floor(t / 20);
            TEMP = leftrotate(A, 5) + fn(n, B, C, D) + E + K[n] + w[t];

            E = D;
            D = C;
            C = leftrotate(B, 30);
            B = A;
            A = TEMP;
            }

            H[0] += A;
            H[1] += B;
            H[2] += C;
            H[3] += D;
            H[4] += E;
        }

        return wordsToByteArray(H);
    };

    function HMAC(fn, key, message, toHex){
        var k = stringToByteArray(key), m = stringToByteArray(message),
            l = k.length, byteArray, oPad, iPad, i;

        if (l > fn.blocksize) {
            k = fn.hash(k);
            l = k.length;
        }

        k = k.concat(zeroPad(fn.blocksize - l));

        oPad = k.slice(0); // copy
        iPad = k.slice(0); // copy

        for (i = 0; i < fn.blocksize; i++) {
            oPad[i] ^= 0x5C;
            iPad[i] ^= 0x36;
        }

        byteArray = fn.hash(oPad.concat(fn.hash(iPad.concat(m))));

        if (toHex) {
            return byteArrayToHex(byteArray);
        }
        return byteArrayToString(byteArray);
    }

    return OAuth;
})(exports);
var exports = exports || this;
(function (global) {
    var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

    /**
     * Base64 encode a string
     * @param string {string} the string to be base64 encoded
     */
    global.btoa = global.btoa || function (string) {
        var i = 0, length = string.length, ascii, index, output = '';

        for (; i < length; i+=3) {
            ascii = [
                string.charCodeAt(i),
                string.charCodeAt(i+1),
                string.charCodeAt(i+2)
            ];

            index = [
                ascii[0] >> 2,
                ((ascii[0] & 3) << 4) | ascii[1] >> 4,
                ((ascii[1] & 15) << 2) | ascii[2] >> 6,
                ascii[2] & 63
            ];

            if (isNaN(ascii[1])) {
                index[2] = 64;
            }
            if (isNaN(ascii[2])) {
                index[3] = 64;
            }

            output += b64.charAt(index[0]) + b64.charAt(index[1]) + b64.charAt(index[2]) + b64.charAt(index[3]);
        }

        return output;
    };
})(exports);
