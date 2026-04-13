import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

var AuthContext = createContext(null);

export function AuthProvider(props) {
  var children = props.children;
  var _state = useState(null);
  var user = _state[0];
  var setUser = _state[1];
  var _loading = useState(true);
  var loading = _loading[0];
  var setLoading = _loading[1];

  useEffect(function() {
    var token = localStorage.getItem('crm_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = 'Bearer ' + token;
      api.get('/auth/me')
        .then(function(res) {
          setUser(res.data.user);
          setLoading(false);
        })
        .catch(function() {
          localStorage.removeItem('crm_token');
          delete api.defaults.headers.common['Authorization'];
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  function login(token, userData) {
    localStorage.setItem('crm_token', token);
    api.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('crm_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }

  return React.createElement(
    AuthContext.Provider,
    { value: { user: user, loading: loading, login: login, logout: logout } },
    children
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
