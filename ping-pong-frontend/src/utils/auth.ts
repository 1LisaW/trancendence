export const getUser = () => {
  return (localStorage.getItem('user') || null);
}

export const setUser = (user: string) => {
  localStorage.setItem('user', user);
}

export const setToken = (token:string) =>
{
  localStorage.setItem('token', token);
}

export const removeToken = () => {
  localStorage.removeItem('token');
}

export const getToken = () => {
  return (localStorage.getItem('token') || '');

}

export const isAuthenticated = async (): Promise<string | undefined> => {
  let name: string | undefined = undefined;
  await fetch(`/api/auth/user`, {
    method: "GET",
    headers: {
      "Authorization": getToken(),
    },
  }).then((res) => res.json()
  ).then(res => {
    console.log(res);
    if (res.error)
      removeToken();
    else
      name = res.user.name;
  });
  return (name);
}
