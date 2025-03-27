export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL;

  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjEyOTc3LCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4ZDFlMmEzQWIyZDE0NDk0QTA2MjU4YTJjNDE5OGJjMDE3MDg2OTMxRCJ9",
      payload: "eyJkb21haW4iOiJhcGwtZnJhbWUudmVyY2VsLmFwcCJ9",
      signature:
        "MHg5YjFlM2I2YzkxNzAwZDQzYzBlYWNhYmQzMGU1MWI5ZTMyOGE0MTZhODI1NmMxMWM4MDMxNmU3ZDI5Mzc1ZmRkNjY0OTZhYzYzOTZkYmZkODUxMjgxNWRmYzdjNDJlMDEwYTNlYjEwZDZjOWE0MzBmMzMwYmJmNmFhYTk2MjgyYTFi",
    },
    frame: {
      version: "0.0.1",
      name: "APL Daily",
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/image.png`,
      buttonTitle: "Launch Today's Pattern",
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#fff",
      webhookUrl: `${appUrl}/api/webhook`,
    },
  };

  return Response.json(config);
}