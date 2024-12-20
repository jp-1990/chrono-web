import {
  type DeleteItemArgs,
  type DeleteItemsRes,
  type GetItemArgs,
  type GetItemsRes,
  type PatchItemArgs,
  type PatchItemsRes,
  type PostItemArgs,
  type PostItemsRes
} from '~/types/item';

export const getItems = async ({
  startDate,
  endDate
}: GetItemArgs): Promise<GetItemsRes> => {
  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `${window.localStorage.getItem('token')}`
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
      authorization: `${window.localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      query: `
          mutation {
            createTask (
              title: "${item.title}",
              group: "${item.group}",
              description: "${item.notes.replaceAll('"', '\\"')}",
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
): Promise<PatchItemsRes[]> => {
  let result: any[] = [];

  const singleUpdateResponse = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `${window.localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      query: `
          mutation {
            updateTask (
              id: "${item.id}",
              title: "${item.title}",
              description: "${item.notes.replaceAll('"', '\\"')}",
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
  const { data } = await singleUpdateResponse.json();
  result = [data.updateTask];

  if (item.title && (item.group !== undefined || item.color !== undefined)) {
    const multiColorAndGroupUpdateResponse = await fetch(
      'http://localhost:4000/graphql',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `${window.localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          query: `
          mutation {
            updateTaskColourAndGroup (
              title: "${item.title}",
              ${typeof item.group === 'string' ? `group: "${item.group}",` : ''}
              ${
                typeof item.color === 'string' ? `colour: "${item.color}",` : ''
              }
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
      }
    );
    const { data } = await multiColorAndGroupUpdateResponse.json();
    result = data.updateTaskColourAndGroup;
  }

  return result;
};

export const deleteItem = async (
  item: DeleteItemArgs
): Promise<DeleteItemsRes> => {
  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `${window.localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      query: `
          mutation {
            deleteTask (
              id: "${item.id}",
              ) {
                id
            }
          }
        `
    })
  });
  const { data } = await response.json();
  return data.deleteTask;
};
