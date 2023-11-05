<template>
  <div>test</div>
  <button @click="postTest">CALL POST http://localhost:8000/activity</button>
  <button @click="getTest">
    CALL GET http://localhost:8000/activity/5f00caa89e941724088821ec
  </button>
  <button @click="patchTest">
    CALL PATCH http://localhost:8000/activity/6547f3fe31cb0a68a3e5ea82
  </button>
  <button @click="deleteTest">
    CALL DELETE http://localhost:8000/activity/6547f3fe31cb0a68a3e5ea82
  </button>
  <button @click="getAllTest">CALL GET http://localhost:8000/activities</button>
</template>

<script lang="ts" setup>
useAuthCheck();

const getTest = async (): Promise<string> => {
  const response = await fetch(
    'http://localhost:8000/activity/5f00caa89e941724088821ec',
    {
      method: 'GET'
      // headers: {
      //   'Access-Control-Allow-Origin': 'http://localhost:8000'
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
  const response = await fetch('http://localhost:8000/activity', {
    method: 'POST',
    headers: {
      // 'Access-Control-Allow-Origin': 'http://localhost:8000'
      'Content-Type': 'application/json',
      'access-control-request-headers': 'content-type'
      //   'Access-Control-Request-Headers': 'application/json'
      //   authorization: `${window.localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      title: 'testing',
      description: 'test desc',
      start: new Date(Date.now()),
      end: new Date(Date.now()),
      group: 'test group',
      color: '#000000'
    })
  });
  const res = await response.json();
  console.log('response', response, res);

  return '';
};

const patchTest = async (): Promise<string> => {
  const response = await fetch(
    'http://localhost:8000/activity/6547f3fe31cb0a68a3e5ea82',
    {
      method: 'PATCH',
      headers: {
        // 'Access-Control-Allow-Origin': 'http://localhost:8000'
        'Content-Type': 'application/json',
        'access-control-request-headers': 'content-type'
        //   'Access-Control-Request-Headers': 'application/json'
        //   authorization: `${window.localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        title: 'testing 2',
        description: ''
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
    'http://localhost:8000/activity/6547f3fe31cb0a68a3e5ea82',
    {
      method: 'DELETE'
      //   headers: {
      //     // 'Access-Control-Allow-Origin': 'http://localhost:8000'
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
  const response = await fetch('http://localhost:8000/activities', {
    method: 'GET'
    // headers: {
    //   'Access-Control-Allow-Origin': 'http://localhost:8000'
    //   'Content-Type': 'application/json',
    //   authorization: `${window.localStorage.getItem('token')}`
    // }
  });
  const res = await response.json();
  console.log('response', response, res);

  return '';
};
</script>
