export const getItems = async (startDate: Date, endDate: Date) => {
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
