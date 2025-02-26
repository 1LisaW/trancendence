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
      // "Content-Type": "application/json",
    },
  }).then((res) => res.json()
  ).then(res => {
    console.log(res);
    name = (res.name);
    if (!name)
      removeToken();
    // if (res.status)
    // let container;
    // switch (res.status) {
  });
  return (name);
  // return (false);
}
