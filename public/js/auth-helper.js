var AuthHelper = (function() {
  var TOKEN_KEY = 'finance_token';
  var USER_KEY = 'finance_user';
  var API_BASE = window.location.origin;

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    var userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }

  function saveAuth(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function authFetch(url, options) {
    options = options || {};
    options.headers = options.headers || {};
    var token = getToken();
    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }
    if (!(options.body instanceof FormData)) {
      options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
    }
    return fetch(url, options).then(function(res) {
      if (res.status === 401) {
        clearAuth();
        window.location.href = API_BASE + '/login.html';
        return Promise.reject(new Error('未授权'));
      }
      return res;
    });
  }

  function checkAuth() {
    var token = getToken();
    if (!token) {
      window.location.href = API_BASE + '/login.html';
      return;
    }

    return fetch(API_BASE + '/api/auth/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (!data.success) {
          clearAuth();
          window.location.href = API_BASE + '/login.html';
        }
      })
      .catch(function() {
        clearAuth();
        window.location.href = API_BASE + '/login.html';
      });
  }

  function logout() {
    var token = getToken();
    if (token) {
      fetch(API_BASE + '/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      }).catch(function() {});
    }
    clearAuth();
    window.location.href = API_BASE + '/login.html';
  }

  return {
    getToken: getToken,
    getUser: getUser,
    saveAuth: saveAuth,
    clearAuth: clearAuth,
    authFetch: authFetch,
    checkAuth: checkAuth,
    logout: logout
  };
})();