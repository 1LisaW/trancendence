export const getUser = () => {
  return (localStorage.getItem('user') || null);
}

export const setUser = (user: string) => {
  localStorage.setItem('user', user);
}

export const setToken = (token: string) => {
  localStorage.setItem('token', token);
}

export const removeToken = () => {
  localStorage.removeItem('token');
}

export const getToken = () => {
  return (localStorage.getItem('token') || '');

}

export const isAuthenticated = async (): Promise<boolean> => {
  return await fetch(`/gateway/auth/is-auth`, {
    method: "GET",
    headers: {
      "Authorization": getToken(),
    },
  }).then((res) => res.json()
  ).then(res => {
    // console.log(res);
    if (res.isAuth === false)
    {
      removeToken();
      return (false);
    }
    else
       return (true);
    })
}

export const getProfileAvatar = () => {
  return fetch(`/gateway/auth/profile`, {
    method: "GET",
    headers: {
      "Authorization": getToken(),
    },
  }).then((res) => res.json()
  ).then(res => {
    if (res.profile)
      return (res.profile.avatar);
    return ('');
  }).catch((err) => {
    console.log(err);
    return ('');
  });
}
