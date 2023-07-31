import {
  GetItemArgs,
  GetItemsRes,
  PatchItemArgs,
  PatchItemsRes,
  PostItemArgs,
  PostItemsRes
} from '~/types/item';

export const getItems = async ({
  startDate,
  endDate
}: GetItemArgs): Promise<GetItemsRes> => {
  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ZjI1YTE3YjgxZmFkOTQ0MzA4MjBmMzgiLCJpYXQiOjE2ODg1NDA1NzAsImV4cCI6MTY5NjMxNjU3MH0.-1iY37vLRQiUTY1YyDtIj9E1cdJFEADR5yYeFb2JQKI'
    },
    body: JSON.stringify({
      query: `
          query {
            tasks (startDate: "${startDate}", endDate: "${endDate}") {
              id
              title
              group
              description
              colour
              start
              end
              createdAt
              percentageTimes {
                startPercentage
                endPercentage
              }
              luminance
              user {
                id
                name
              }
            }
          }
        `
    })
  });
  const { data } = await response.json();
  return data.tasks;
};

export const postItem = async (item: PostItemArgs): Promise<PostItemsRes> => {
  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ZjI1YTE3YjgxZmFkOTQ0MzA4MjBmMzgiLCJpYXQiOjE2ODg1NDA1NzAsImV4cCI6MTY5NjMxNjU3MH0.-1iY37vLRQiUTY1YyDtIj9E1cdJFEADR5yYeFb2JQKI'
    },
    body: JSON.stringify({
      query: `
          mutation {
            createTask (
              title: "${item.title}",
              group: "${item.group}",
              description: "${item.notes}",
              start: "${item.startDate}",
              end: "${item.endDate}",
              colour: "${item.color}"
              ) {
                id
                title
                group
                description
                colour
                start
                end
                createdAt
                percentageTimes {
                  startPercentage
                  endPercentage
                }
                luminance
                user {
                  id
                  name
                }
            }
          }
        `
    })
  });
  const { data } = await response.json();
  return data.createTask;
};

export const patchItem = async (
  item: PatchItemArgs
): Promise<PatchItemsRes> => {
  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ZjI1YTE3YjgxZmFkOTQ0MzA4MjBmMzgiLCJpYXQiOjE2ODg1NDA1NzAsImV4cCI6MTY5NjMxNjU3MH0.-1iY37vLRQiUTY1YyDtIj9E1cdJFEADR5yYeFb2JQKI'
    },
    body: JSON.stringify({
      query: `
          mutation {
            updateTask (
              id: "${item.id}",
              title: "${item.title}",
              description: "${item.notes}",
              start: "${item.startDate}",
              end: "${item.endDate}",
              ) {
                id
                title
                group
                description
                colour
                start
                end
                createdAt
                percentageTimes {
                  startPercentage
                  endPercentage
                }
                luminance
                user {
                  id
                  name
                }
            }
          }
        `
    })
  });
  const { data } = await response.json();
  console.log('data', data);

  return data.updateTask;
};
