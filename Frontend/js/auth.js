const RcAuth = (() => {
  const SCHOOL_KEY = 'school';
  const PASSWORD_KEY = 'key';
  const ADMIN_KEY = 'adminKey';

  function setAuthSession({ school, key, adminKey = null }) {
    sessionStorage.setItem(SCHOOL_KEY, school);
    sessionStorage.setItem(PASSWORD_KEY, key);

    if (adminKey) {
      sessionStorage.setItem(ADMIN_KEY, adminKey);
    } else {
      sessionStorage.removeItem(ADMIN_KEY);
    }
  }

  function getAuthSession() {
    return {
      school: sessionStorage.getItem(SCHOOL_KEY),
      key: sessionStorage.getItem(PASSWORD_KEY),
      adminKey: sessionStorage.getItem(ADMIN_KEY)
    };
  }

  function clearAuthSession() {
    sessionStorage.removeItem(SCHOOL_KEY);
    sessionStorage.removeItem(PASSWORD_KEY);
    sessionStorage.removeItem(ADMIN_KEY);
  }

  function requireAuthSession({ adminOnly = false } = {}) {
    const auth = getAuthSession();
    const hasAuth = auth.school && auth.key && auth.school !== 'null' && auth.key !== 'null';
    const hasAdminAuth = !adminOnly || auth.school === 'Admin' || Boolean(auth.adminKey);

    if (!hasAuth || !hasAdminAuth) {
      window.location.href = './index.html';
      return null;
    }

    return auth;
  }

  return {
    setAuthSession,
    getAuthSession,
    clearAuthSession,
    requireAuthSession
  };
})();
