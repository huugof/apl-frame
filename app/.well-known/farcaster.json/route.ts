export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL;

  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjEyOTc3LCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4ZDFlMmEzQWIyZDE0NDk0QTA2MjU4YTJjNDE5OGJjMDE3MDg2OTMxRCJ9",
      payload: "eyJkb21haW4iOiJ3YXJtLXB1cmVseS1kb3J5Lm5ncm9rLWZyZWUuYXBwIn0",
      signature:
        "MHgzMTMwZmM1ZDMwYmI0Y2FlNWRiNTJkZmRhNDQ5OTcyNDRmMjUxYjhkYWExMzFlZTE0ZmEwOGY5N2Y3MDhiOWY2NDBkNDc2YWRkZTRiNjkyMjc0Y2EzOGYwYWUwMDkyOTc5ZDUzZGMxNjllZWY0Yzg3MTFjNjRjOGU2ZDdmMmQzNzFi",
    },
    frame: {
      version: "0.0.1",
      name: "APL Daily",
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/start.png`,
      buttonTitle: "Launch Today's Pattern",
      splashImageUrl: `${appUrl}/splash-bw.png`,
      splashBackgroundColor: "#fff",
      webhookUrl: `${appUrl}/api/webhook`,
    },
  };

  return Response.json(config);
}