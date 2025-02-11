export const getUser = () => {
  return (localStorage.getItem('user') || null);
}

export const setUser = (user: string) => {
  localStorage.setItem('user', user);
}

export const isAuthenticated = () => {
  return (false);
}
