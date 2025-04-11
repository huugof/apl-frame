export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL;

  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjEyOTc3LCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4ZDFlMmEzQWIyZDE0NDk0QTA2MjU4YTJjNDE5OGJjMDE3MDg2OTMxRCJ9",
      payload: "eyJkb21haW4iOiI2M2JlLTY0LTk5LTI0Ny0xOTgubmdyb2stZnJlZS5hcHAifQ",
      signature:
        "MHhiYjcwOTFiN2U3ZWFkYTY5NWE4MWRiODhjOGY3OTY4YTUyNWU1Y2RlOTE1NzQyN2U2Mzc0NTczMDM0ODY3NDZiMTg0MDE3YzM5Y2UxZjg1ZTA3MjdhZmE2NGVjNmI4ZTA0ZDY0OGViOThkYzYzYWFjZThhMGM0ZjYyOGJhYTU0YTFj",
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