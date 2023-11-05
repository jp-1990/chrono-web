import { LoginArgs, LoginRes, SignupArgs, SignupRes } from '~/types/user';

export const login = async (user: LoginArgs): Promise<LoginRes> => {
  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `
          mutation {
            signIn (
              email: "${user.email}",
              password: "${user.password}",
              ) {
                token
                tokenExpires
                user {
                  id
                  name
                  email
                  photo
                  role
                  active
                }
            }
          }
        `
    })
  });
  const { data } = await response.json();
  return data.signIn;
};

export const signup = async (user: SignupArgs): Promise<SignupRes> => {
  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `
          mutation {
            registerUser (
              name: "${user.name}",
              email: "${user.email}",
              password: "${user.password}",
              passwordConfirm: "${user.confirmPassword}",
              ) 
          }
        `
    })
  });
  const { data } = await response.json();
  return data.registerUser;
};
