<template>
  <div>test</div>
  <button @click="postTest">CALL POST http://localhost:8000/api/v1/activity</button>
  <button @click="getTest">
    CALL GET http://localhost:8000/api/v1/activity/5f00caa89e941724088821ec
  </button>
  <button @click="patchTest">
    CALL PATCH http://localhost:8000/api/v1/activity/6547f3fe31cb0a68a3e5ea82
  </button>
  <button @click="deleteTest">
    CALL DELETE http://localhost:8000/api/v1/activity/6547f3fe31cb0a68a3e5ea82
  </button>
  <button @click="getAllTest">CALL GET http://localhost:8000/api/v1/activity</button>
  <button @click="login">CALL POST http://localhost:8000/api/v1/login</button>
  <button @click="logout">CALL POST http://localhost:8000/api/v1/logout</button>
  <button @click="signup">CALL POST http://localhost:8000/api/v1/register</button>
  <google-sign-in-button @success="handleLoginSuccess" @error="handleLoginError"></google-sign-in-button>
</template>

<script lang="ts" setup>
import {
  GoogleSignInButton,
  type CredentialResponse,
} from "vue3-google-signin";
import { useUserState } from "~/composables/state";
useAuthCheck();

// handle success event
const handleLoginSuccess = async (response: CredentialResponse) => {
  const { credential } = response;

  // set token to auth header: bearer <token>
  const res = await fetch(
    'http://localhost:8000/api/v1/oauth',
    {
      credentials: 'include',
      method: 'Post',
      headers: {
        // 'Access-Control-Allow-Origin': 'http://localhost:8000/api/v1'
        'Content-Type': 'application/json',
        'access-control-request-headers': 'content-type',
        //   'Access-Control-Request-Headers': 'application/json'
        'Authorization': `${credential}`
      },
    }
  );
  console.log('response', res);


  const user = await res.json()

  const userState = useUserState();
  userState.value = user;

  window.localStorage.setItem('userState', JSON.stringify(user));
};

// handle an error event
const handleLoginError = () => {
  console.error("Login failed");
};


const signup = async (): Promise<string> => {
  const response = await fetch(
    'http://localhost:8000/api/v1/register',
    {
      credentials: 'include',
      method: 'Post',
      headers: {
        // 'Access-Control-Allow-Origin': 'http://localhost:8000/api/v1'
        'Content-Type': 'application/json',
        'access-control-request-headers': 'content-type'
        //   'Access-Control-Request-Headers': 'application/json'
        //   authorization: `${window.localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        email: 'test@gmail.com',
        pass: 'testing',
        givenName: 'TEST',
        familyName: 'ING',
      })
    }
  );
  console.log('response', response);

  return '';
};

const login = async (): Promise<string> => {
  const response = await fetch(
    'http://localhost:8000/api/v1/login',
    {
      credentials: 'include',
      method: 'Post',
      headers: {
        // 'Access-Control-Allow-Origin': 'http://localhost:8000/api/v1'
        'Content-Type': 'application/json',
        'access-control-request-headers': 'content-type'
        //   'Access-Control-Request-Headers': 'application/json'
        //   authorization: `${window.localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        email: 'test@gmail.com',
        pass: 'testing',
      })
    }
  );
  console.log('response', response);

  return '';
};

const logout = async (): Promise<string> => {
  const response = await fetch(
    'http://localhost:8000/api/v1/logout',
    {
      credentials: 'include',
      method: 'Post',
      headers: {
        // 'Access-Control-Allow-Origin': 'http://localhost:8000/api/v1'
        'Content-Type': 'application/json',
        'access-control-request-headers': 'content-type'
        //   'Access-Control-Request-Headers': 'application/json'
        //   authorization: `${window.localStorage.getItem('token')}`
      },
    }
  );
  console.log('response', response);

  return '';
};

const getTest = async (): Promise<string> => {
  const response = await fetch(
    'http://localhost:8000/api/v1/activity/66ccd0ef832a1b4795192219',
    {
      method: 'GET',
      credentials: 'include',
      // headers: {
      //   'Access-Control-Allow-Origin': 'http://localhost:8000/api/v1'
      //   'Content-Type': 'application/json',
      //   authorization: `${window.localStorage.getItem('token')}`
      // }
    }
  );
  const res = await response.json();
  console.log('response', response, res);

  return '';
};

const postTest = async (): Promise<string> => {
  const response = await fetch('http://localhost:8000/api/v1/activity', {
    method: 'POST',
    credentials: 'include',
    headers: {
      // 'Access-Control-Allow-Origin': 'http://localhost:8000/api/v1'
      'Content-Type': 'application/json',
      'access-control-request-headers': 'content-type'
      //   'Access-Control-Request-Headers': 'application/json'
      //   authorization: `${window.localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      variant: 'Default',
      title: 'testing',
      group: 'test group',
      notes: 'test desc',
      start: new Date('2024-11-12T19:00:00.000Z'),
      end: new Date(Date.now()),
      timezone: new Date(Date.now()).getTimezoneOffset(),
    })
  });
  const res = await response.json();
  console.log('response', response, res);

  return '';
};

const patchTest = async (): Promise<string> => {
  const response = await fetch(
    'http://localhost:8000/api/v1/activity/66ccd0ef832a1b4795192219',
    {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        // 'Access-Control-Allow-Origin': 'http://localhost:8000/api/v1'
        'Content-Type': 'application/json',
        'access-control-request-headers': 'content-type'
        //   'Access-Control-Request-Headers': 'application/json'
        //   authorization: `${window.localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        title: 'testing 2',
        notes: ''
        //   start: new Date(Date.now()),
        //   end: new Date(Date.now()),
        //   group: 'test group',
        //   color: '#000000'
      })
    }
  );
  const res = await response.json();
  console.log('response', response, res);

  return '';
};

const deleteTest = async (): Promise<string> => {
  const response = await fetch(
    'http://localhost:8000/api/v1/activity/66ccd0ef832a1b4795192219',
    {
      method: 'DELETE',
      credentials: 'include',
      //   headers: {
      //     // 'Access-Control-Allow-Origin': 'http://localhost:8000/api/v1'
      //     'Content-Type': 'application/json',
      //     'access-control-request-headers': 'content-type'
      //     //   'Access-Control-Request-Headers': 'application/json'
      //     //   authorization: `${window.localStorage.getItem('token')}`
      //   },
      //   body: JSON.stringify({
      //     title: 'testing 2',
      //     description: ''
      //     //   start: new Date(Date.now()),
      //     //   end: new Date(Date.now()),
      //     //   group: 'test group',
      //     //   color: '#000000'
      //   })
    }
  );
  const res = await response.json();
  console.log('response', response, res);

  return '';
};

const getAllTest = async (): Promise<string> => {
  const url = new URL('http://localhost:8000/api/v1/activity');

  // without Z = create dates in the current timezone as defined by the browswer
  // below would get items created within the current month based on the user tz
  url.searchParams.set('start', new Date('2024-11-01T00:00:00.000').toISOString());
  url.searchParams.set('end', new Date('2024-11-30T23:59:59.999').toISOString());

  /*
  - create all activities in UTC (with Z), then fetch and display based on users timezone
  - store created at tz against activity

  GET:
  queryparam - tz offset
  calculate all frontend css requirements on server based on stored time adjusted by the requesting users tz
  returned items should have their original start/end dates
  frontend should perform date opperations based on its own tz offset
  
  */

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include'
    // headers: {
    //   'Access-Control-Allow-Origin': 'http://localhost:8000/api/v1'
    //   'Content-Type': 'application/json',
    //   authorization: `${window.localStorage.getItem('token')}`
    // }
  });
  const res = await response.json();
  console.log('response', response, res);

  return '';
};
</script>
